/**
 * Rate limiting for the public surface. Node.js only (route handlers and
 * page server components).
 *
 * Buckets (sliding window, keyed by client IP):
 *   public-write — 20 req/min: POST /api/requests, POST /api/consent/events,
 *                  POST /api/consent/guardian, POST /api/q/*
 *   public-read  — 60 req/min: GET /q/*, GET /r/*
 *
 * Primary: @upstash/ratelimit over Upstash Redis (UPSTASH_REDIS_REST_URL +
 * UPSTASH_REDIS_REST_TOKEN).
 * Fallback: a sliding-window counter in the app database (rate_limit_hits
 * table). The fallback is correct on every host because the state is shared;
 * a previous in-memory fallback was removed — live verification proved
 * module-level state does not persist across requests on Render, so an
 * in-memory bucket silently never trips there.
 *
 * Returns null when the request may proceed, or a 429 JSON response
 * ({ok:false, error:"rate_limited"}) with a Retry-After header.
 */
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { qOne, run } from "./db";

export type RateBucket = "public-write" | "public-read";

type WindowSpec = `${number} ${"ms" | "s" | "m" | "h" | "d"}` | `${number}${"ms" | "s" | "m" | "h" | "d"}`;

const LIMITS: Record<RateBucket, { max: number; window: WindowSpec; windowMs: number }> = {
  "public-write": { max: 20, window: "60 s", windowMs: 60_000 },
  "public-read": { max: 60, window: "60 s", windowMs: 60_000 },
};

let warned = false;
let limiters: Record<RateBucket, Ratelimit> | null = null;
let redisUnavailableLogged = false;

function getLimiters(): Record<RateBucket, Ratelimit> | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warned) {
      warned = true;
      // One line at boot; never includes secrets.
      console.warn("[pramaan] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set — rate limiting uses the database-backed fallback (shared state, correct on every host)");
    }
    return null;
  }
  if (!limiters) {
    const redis = new Redis({ url, token });
    limiters = {
      "public-write": new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(LIMITS["public-write"].max, LIMITS["public-write"].window),
        prefix: "pramaan:rl:write",
      }),
      "public-read": new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(LIMITS["public-read"].max, LIMITS["public-read"].window),
        prefix: "pramaan:rl:read",
      }),
    };
  }
  return limiters;
}

/* Database-backed sliding-window fallback: rate_limit_hits(bucket, ip, ts).
 * Correct on every host because the counter state lives in the shared DB,
 * not in process memory. Node.js only (uses the DB client). */
async function dbCheck(
  ip: string, bucket: RateBucket, max: number, windowMs: number
): Promise<{ ok: boolean; retryAfter: number }> {
  const now = Date.now();
  const cutoff = now - windowMs;
  // Opportunistic prune of this key's expired hits so the table stays small.
  await run("DELETE FROM rate_limit_hits WHERE bucket = ? AND ip = ? AND ts <= ?", bucket, ip, cutoff);
  const row = (await qOne<{ n: number }>(
    "SELECT COUNT(*) AS n FROM rate_limit_hits WHERE bucket = ? AND ip = ? AND ts > ?",
    bucket, ip, cutoff
  )) ?? { n: 0 };
  if (row.n >= max) {
    const oldest = (await qOne<{ t: number }>(
      "SELECT MIN(ts) AS t FROM rate_limit_hits WHERE bucket = ? AND ip = ? AND ts > ?",
      bucket, ip, cutoff
    ))?.t ?? now;
    return { ok: false, retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }
  await run("INSERT INTO rate_limit_hits (bucket, ip, ts) VALUES (?, ?, ?)", bucket, ip, now);
  return { ok: true, retryAfter: 0 };
}

export function getClientIp(req: Request): string {
  return clientIpFromHeaders(req.headers);
}

/** Client IP from a Headers object — for server components (Node runtime). */
export function clientIpFromHeaders(h: Headers): string {
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0].trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

function rateLimited(retryAfter: number): NextResponse {
  return NextResponse.json({ ok: false, error: "rate_limited" }, {
    status: 429,
    headers: { "Retry-After": String(retryAfter) },
  });
}

/**
 * Enforce the bucket for this request. Returns null when allowed, or the 429
 * response to return directly from the route handler / middleware.
 */
export async function checkRateLimit(req: Request, bucket: RateBucket): Promise<NextResponse | null> {
  return checkRateLimitByIp(getClientIp(req), bucket);
}

/**
 * Enforce the bucket for a bare client IP. Node.js only (route handlers and
 * page server components). Primary: Upstash Redis when configured; fallback:
 * the database-backed sliding window (correct on every host — a previous
 * in-memory fallback was removed after live verification proved process
 * memory is not shared across requests on the production host).
 */
export async function checkRateLimitByIp(ip: string, bucket: RateBucket): Promise<NextResponse | null> {
  const key = `${bucket}:${ip}`;
  const { max, windowMs } = LIMITS[bucket];
  const ups = getLimiters();
  if (ups) {
    let res;
    try {
      res = await ups[bucket].limit(key);
    } catch (e) {
      if (!redisUnavailableLogged) {
        redisUnavailableLogged = true;
        console.warn("[pramaan] Upstash rate-limit check failed, falling back to the database counter");
      }
      const d = await dbCheck(ip, bucket, max, windowMs);
      return d.ok ? null : rateLimited(d.retryAfter);
    }
    if (!res.success) {
      return rateLimited(Math.max(1, Math.ceil((res.reset - Date.now()) / 1000)));
    }
    return null;
  }
  const d = await dbCheck(ip, bucket, max, windowMs);
  return d.ok ? null : rateLimited(d.retryAfter);
}
