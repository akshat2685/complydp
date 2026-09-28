import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Admin gate for the Pramaan console.
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
  // TEMPORARY (2026-09-28): one-time demo-data wipe. Remove with the endpoint.
  ["POST", /^\/api\/admin\/wipe$/],
];

function isPublic(method: string, path: string): boolean {
  if (path.startsWith("/_next/") || path === "/favicon.ico" || path === "/robots.txt") return true;
  return PUBLIC.some(([m, re]) => m === method && re.test(path));
}

export function middleware(req: NextRequest) {
  const key = process.env.PRAMAAN_ADMIN_KEY;
  const path = req.nextUrl.pathname;

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

  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  const header = req.headers.get("x-pramaan-key");
  if (cookie === key || header === key) return NextResponse.next();

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
