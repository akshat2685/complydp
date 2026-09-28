import { db, ok, bad, body, parseJson, nowIso, record } from "@/server/api";
import { maskSecret } from "@/server/notify";

/**
 * GET /api/admin/notifications — notification provider config for tenant_meridian.
 * Secrets are NEVER returned in full: only masked previews ("re_****abcd").
 */
export async function GET() {
  const d = db();
  const row = d.prepare("SELECT settings_json FROM tenant WHERE id = 'tenant_meridian'").get() as
    | { settings_json: string }
    | undefined;
  if (!row) return bad("Tenant not found", 404);
  const settings = parseJson<Record<string, unknown>>(row.settings_json, {});
  const n = (settings["notifications"] ?? {}) as Record<string, string>;
  const pick = (k: string) => (n[k] ?? "").trim();
  // Secrets are NEVER returned in full — only masked previews. The UI keeps
  // existing secrets by sending nothing; empty string means "not set".
  return ok({
    notifications: {
      resend_api_key: "",
      resend_from: pick("resend_from"),
      resend_base_url: pick("resend_base_url"),
      whatsapp_webhook_url: pick("whatsapp_webhook_url"),
      whatsapp_bearer: "",
    },
    masked: {
      resend_api_key: pick("resend_api_key") ? maskSecret(pick("resend_api_key")) : "",
      whatsapp_bearer: pick("whatsapp_bearer") ? maskSecret(pick("whatsapp_bearer")) : "",
    },
    configured: {
      email: pick("resend_api_key").length > 0,
      whatsapp: pick("whatsapp_webhook_url").length > 0,
    },
  });
}

interface NotificationsBody {
  resend_api_key?: string;
  resend_from?: string;
  resend_base_url?: string;
  whatsapp_webhook_url?: string;
  whatsapp_bearer?: string;
}

const KEYS = ["resend_api_key", "resend_from", "resend_base_url", "whatsapp_webhook_url", "whatsapp_bearer"] as const;

/**
 * POST /api/admin/notifications — save notification provider config.
 * Read-modify-write on tenant.settings_json: only the "notifications" key is
 * replaced; every other setting is preserved. Empty-string values CLEAR that
 * field (so a rotated/leaked key can be removed from the UI).
 */
export async function POST(req: Request) {
  const b = await body<NotificationsBody>(req);
  if (!b) return bad("Invalid JSON body");
  const d = db();
  const row = d.prepare("SELECT settings_json FROM tenant WHERE id = 'tenant_meridian'").get() as
    | { settings_json: string }
    | undefined;
  if (!row) return bad("Tenant not found", 404);
  const settings = parseJson<Record<string, unknown>>(row.settings_json, {});
  const current = ((settings["notifications"] ?? {}) as Record<string, string>) ?? {};

  const next: Record<string, string> = { ...current };
  for (const k of KEYS) {
    if (b[k] !== undefined) next[k] = String(b[k] ?? "").trim();
  }
  settings["notifications"] = next;

  d.prepare("UPDATE tenant SET settings_json = ? WHERE id = 'tenant_meridian'").run(JSON.stringify(settings));

  record(
    "tenant.notifications_updated",
    "tenant",
    "tenant_meridian",
    "Notification provider settings updated (values stored, not echoed)",
    {
      email_configured: (next.resend_api_key ?? "").length > 0,
      whatsapp_configured: (next.whatsapp_webhook_url ?? "").length > 0,
      at: nowIso(),
    },
    "dpo"
  );

  return ok({
    ok: true,
    masked: {
      resend_api_key: next.resend_api_key ? maskSecret(next.resend_api_key) : "",
      whatsapp_bearer: next.whatsapp_bearer ? maskSecret(next.whatsapp_bearer) : "",
    },
    configured: {
      email: (next.resend_api_key ?? "").length > 0,
      whatsapp: (next.whatsapp_webhook_url ?? "").length > 0,
    },
  });
}
