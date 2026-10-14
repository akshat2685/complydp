/**
 * Admin session management — opaque tokens, never the raw admin key.
 *
 * On login, a 32-byte random token is issued; only its SHA-256 hex is stored
 * in the `sessions` table. Validation hashes the presented cookie and does a
 * timing-safe compare against the stored hash (node:crypto timingSafeEqual).
 * Sessions expire after 7 days. The `x-pramaan-key` header path compares
 * against the env key directly (needed for scripts/smoke tests) and is
 * unchanged.
 *
 * Node runtime only — never import from middleware unless middleware runs on
 * the Node.js runtime (see src/middleware.ts), and never from client code.
 */
import crypto from "node:crypto";
import { qOne, run, sha256 } from "./db";
import { log } from "./log";

export const ADMIN_COOKIE = "pramaan_admin";
export const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;

/** SHA-256 hex of a session token — the only form ever persisted. */
export function hashSessionToken(token: string): string {
  return sha256(token);
}

/** Issue a new session; returns the RAW token (set as the cookie value). */
export async function createSession(): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await run("INSERT INTO sessions (token_hash, created_at) VALUES (?, ?)", hashSessionToken(token), Date.now());
  return token;
}

/** True when the presented token maps to a live, unexpired session. */
export async function validateSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== "string" || token.length < 32) return false;
  const h = hashSessionToken(token);
  let row: { token_hash: string; created_at: number } | undefined;
  try {
    row = await qOne<{ token_hash: string; created_at: number }>(
      "SELECT token_hash, created_at FROM sessions WHERE token_hash = ?",
      h
    );
  } catch (e) {
    log.error({ err: e instanceof Error ? e.message : String(e) }, "session lookup failed");
    return false;
  }
  if (!row) return false;
  // Constant-time compare of the stored hash vs the computed hash, so a
  // valid-vs-invalid token isn't distinguishable by response timing.
  const a = Buffer.from(row.token_hash, "utf8");
  const b = Buffer.from(h, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  if (Date.now() - row.created_at > SESSION_TTL_MS) {
    await run("DELETE FROM sessions WHERE token_hash = ?", h).catch(() => undefined);
    return false;
  }
  return true;
}

/** Revoke a session (logout). Idempotent — unknown tokens are a no-op. */
export async function deleteSession(token: string | undefined | null): Promise<void> {
  if (!token || typeof token !== "string") return;
  try {
    await run("DELETE FROM sessions WHERE token_hash = ?", hashSessionToken(token));
  } catch (e) {
    log.error({ err: e instanceof Error ? e.message : String(e) }, "session delete failed");
  }
}

/** Extract the raw session token from a Cookie header (server-side). */
export function sessionTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(/(?:^|;\s*)pramaan_admin=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Authoritative admin check for API routes (Node runtime). Passes when the
 * `x-pramaan-key` header matches the env key (scripts / smoke tests), or
 * when the session cookie validates against the sessions table
 * (SHA-256 + timingSafeEqual). Returns null when authorized, otherwise the
 * 401/503 Response the handler should return directly.
 *
 * Usage: `const denied = await requireAdmin(req); if (denied) return denied;`
 */
export async function requireAdmin(req: Request): Promise<Response | null> {
  const key = process.env.PRAMAAN_ADMIN_KEY;
  if (!key) {
    // Mirror the middleware fail-closed rule: production refuses, dev stays open.
    if (process.env.NODE_ENV === "production") {
      return Response.json({ ok: false, error: "service_not_configured" }, { status: 503 });
    }
    return null;
  }
  const header = req.headers.get("x-pramaan-key");
  if (header && header === key) return null;
  if (await validateSessionToken(sessionTokenFromCookieHeader(req.headers.get("cookie")))) {
    return null;
  }
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}
