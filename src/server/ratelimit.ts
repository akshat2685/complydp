/**
 * Rate limiting for the public surface. Edge-compatible (no node: imports) so
 * it can run in middleware as well as in Node route handlers.
 *
 * Buckets (sliding window, keyed by client IP):
 *   public-write — 20 req/min: POST /api/requests, POST /api/consent/events,
 *                  POST /api/consent/guardian, POST /api/q/*
 *   public-read  — 60 req/min: GET /q/*, GET /r/*
 *
 * Primary: @upstash/ratelimit over Upstash Redis (UPSTASH_REDIS_REST_URL +
 * UPSTASH_REDIS_REST_TOKEN). When unset (local dev, CI) it falls back to an
 * in-memory sliding-window counter with the same limits and logs a one-line
 * warn at boot. The in-memory fallback is single-process only — fine for dev,
 * not a substitute for Redis in production.
 *
 * Returns null when the request may proceed, or a 429 JSON response
 * ({ok:false, error:"rate_limited"}) with a Retry-After header.
 */
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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
      console.warn("[pramaan] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set — rate limiting uses the in-memory fallback (single-process only)");
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

/* In-memory sliding-window fallback: key -> sorted array of hit timestamps. */
const memHits = new Map<string, number[]>();

function memCheck(key: string, max: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (memHits.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= max) {
    memHits.set(key, hits);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000)) };
  }
  hits.push(now);
  memHits.set(key, hits);
  return { ok: true, retryAfter: 0 };
}

// Prune idle keys opportunistically so the map can't grow unboundedly
// (memCheck's filter only trims keys that are hit again).
try {
  const pruner = setInterval(() => {
    const now = Date.now();
    for (const [k, hits] of memHits) {
      if (hits.length === 0 || now - hits[hits.length - 1] > 60_000) memHits.delete(k);
    }
  }, 60_000);
  // Don't keep a bare node process alive just for the pruner (Node only;
  // edge runtimes have no unref).
  (pruner as unknown as { unref?: () => void }).unref?.();
} catch {
  /* timer unavailable — growth is still bounded per accessed key */
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0].trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
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
  const ip = getClientIp(req);
  const key = `${bucket}:${ip}`;
  const ups = getLimiters();
  if (ups) {
    let res;
    try {
      res = await ups[bucket].limit(key);
    } catch (e) {
      if (!redisUnavailableLogged) {
        redisUnavailableLogged = true;
        console.warn("[pramaan] Upstash rate-limit check failed, falling back to in-memory for this process");
      }
      const { max, windowMs } = LIMITS[bucket];
      const m = memCheck(`mem:${key}`, max, windowMs);
      return m.ok ? null : rateLimited(m.retryAfter);
    }
    if (!res.success) {
      return rateLimited(Math.max(1, Math.ceil((res.reset - Date.now()) / 1000)));
    }
    return null;
  }
  const { max, windowMs } = LIMITS[bucket];
  const m = memCheck(`mem:${key}`, max, windowMs);
  return m.ok ? null : rateLimited(m.retryAfter);
}
