import { bad, body } from "@/server/api";
import { ADMIN_COOKIE, createSession } from "@/server/session";
import { log } from "@/server/log";
import { withApiLog } from "@/server/withApiLog";

/**
 * POST /api/auth/login — exchange the admin key for an opaque session token.
 * The cookie holds a random 32-byte token; only its SHA-256 is stored
 * server-side. The raw admin key is never placed in a cookie.
 */
async function POST_impl(req: Request) {
  const configured = process.env.PRAMAAN_ADMIN_KEY;
  if (!configured) return bad("service_not_configured", 503);
  const b = await body<{ key?: string }>(req);
  if (!b?.key || b.key !== configured) {
    log.warn({ event: "auth.login_failed" }, "admin login rejected");
    return bad("invalid key", 401);
  }
  const token = await createSession();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  log.info({ event: "auth.login" }, "admin session created");
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=604800`,
    },
  });
}

export const POST = withApiLog(POST_impl);
