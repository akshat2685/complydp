import { ADMIN_COOKIE, deleteSession, sessionTokenFromCookieHeader } from "@/server/session";
import { log } from "@/server/log";
import { withApiLog } from "@/server/withApiLog";

/** POST /api/auth/logout — revoke the session row and clear the cookie. */
async function POST_impl(req: Request) {
  const token = sessionTokenFromCookieHeader(req.headers.get("cookie"));
  await deleteSession(token);
  log.info({ event: "auth.logout" }, "admin session revoked");
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    },
  });
}

export const POST = withApiLog(POST_impl);
