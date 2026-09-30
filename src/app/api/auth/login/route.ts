import { bad, body } from "@/server/api";

const COOKIE = "pramaan_admin";

/** POST /api/auth/login — exchange the admin key for a session cookie. */
export async function POST(req: Request) {
  const configured = process.env.PRAMAAN_ADMIN_KEY;
  if (!configured) return bad("service_not_configured", 503);
  const b = await body<{ key?: string }>(req);
  if (!b?.key || b.key !== configured) {
    return bad("invalid key", 401);
  }
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": `${COOKIE}=${encodeURIComponent(configured)}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=604800`,
    },
  });
}
