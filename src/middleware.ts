import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Admin gate for the Pramaan console.
 *
 * NOTE on where the real auth check lives: this middleware runs on the Edge
 * runtime (Next 15.1 has no stable Node.js middleware runtime — the
 * experimental flag doesn't take effect), so it cannot use node:crypto or the
 * DB client. It therefore acts as a COARSE gate: public paths pass, the
 * `x-pramaan-key` header is checked against the env key, and for cookie
 * auth it only checks that a well-formed session token is PRESENT.
 *
 * The AUTHORITATIVE check — SHA-256 hash of the presented cookie plus a
 * timing-safe compare against the sessions table — runs in Node.js:
 * in every admin API route via requireAdmin() (src/server/session.ts) and
 * in the console layout. The raw admin key is never the cookie value; the
 * cookie holds an opaque session token (see POST /api/auth/login).
 *
 * Active iff PRAMAAN_ADMIN_KEY is set. Public embed/ingest surface stays open:
 * the consent snippet, guardian submissions, public DSR intake, vendor
 * questionnaire pages + submissions, and the health check.
 *
 * Fail-closed: in production with no key configured, everything except
 * /api/health returns 503 — the app refuses to run exposed.
 */
const ADMIN_COOKIE = "pramaan_admin";

// [method, pathRegex] — public even when the gate is active
const PUBLIC: Array<[string, RegExp]> = [
  ["GET", /^\/api\/health$/],
  ["GET", /^\/login$/],
  ["POST", /^\/api\/auth\/(login|logout)$/],
  ["OPTIONS", /.*/], // CORS preflights for the cross-site snippet
  ["POST", /^\/api\/consent\/events$/],
  ["POST", /^\/api\/consent\/guardian$/],
  ["GET", /^\/api\/consent\/config$/],
  ["GET", /^\/api\/consent\/snippet$/],
  ["GET", /^\/q\//],
  ["POST", /^\/api\/q\//],
  ["GET", /^\/r\//],
  ["POST", /^\/api\/requests$/], // public DSR intake form
];

function isPublic(method: string, path: string): boolean {
  if (
    path.startsWith("/_next/") ||
    path === "/favicon.ico" ||
    path === "/icon.svg" || // Seal favicon — must not 307 to /login for logged-out browsers
    path === "/robots.txt"
  )
    return true;
  return PUBLIC.some(([m, re]) => m === method && re.test(path));
}

export async function middleware(req: NextRequest) {
  const key = process.env.PRAMAAN_ADMIN_KEY;
  const path = req.nextUrl.pathname;

  // NOTE: public-page read rate limiting lives in the page server components
  // (q/[token], r/[property]) via checkRateLimitByIp — Node-side, where the
  // in-memory fallback state persists per process. It was previously also
  // attempted here in middleware, but Edge isolates don't share module state
  // across requests in production, so the middleware check never accumulated
  // without Redis. Public POST writes are limited in their route handlers.

  if (!key) {
    // Dev stays open. Production refuses to serve anything but the health
    // check (which reports the misconfiguration honestly).
    if (process.env.NODE_ENV === "production" && path !== "/api/health") {
      return NextResponse.json(
        { ok: false, error: "service_not_configured", detail: "PRAMAAN_ADMIN_KEY is not set" },
        { status: 503 }
      );
    }
    return NextResponse.next();
  }

  if (isPublic(req.method, path)) return NextResponse.next();

  const header = req.headers.get("x-pramaan-key");
  if (header && header === key) return NextResponse.next();

  // Coarse cookie gate: a session token must be present and well-formed
  // (real tokens are 64 hex chars). Validity is enforced in Node — see above.
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (token && token.length >= 32) return NextResponse.next();

  if (path.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", path);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
