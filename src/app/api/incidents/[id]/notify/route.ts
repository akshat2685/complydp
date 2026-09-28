import { db, ok, bad, body, record, newId, nowIso } from "@/server/api";
import { sendEmail, sendWhatsApp, getSenderStatus } from "@/server/notify";

interface NotifyBody {
  channel: "board_email" | "user_email" | "user_whatsapp" | "inapp";
  recipient: string;
  subject?: string;
  message: string;
}

/**
 * POST /api/incidents/:id/notify — notify about a breach.
 *
 * Real sends when a provider is configured (Resend for email channels, the
 * WhatsApp webhook for user_whatsapp); inapp stays log-only. When no provider
 * is configured the notification is honestly LOGGED as evidence only.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: breachId } = await params;
  const b = await body<NotifyBody>(req);
  if (!b?.channel || !b?.recipient || !b?.message) {
    return bad("channel, recipient and message are required");
  }
  const d = db();
  const breach = d.prepare("SELECT * FROM breach_cases WHERE id = ?").get(breachId) as Record<string, unknown> | undefined;
  if (!breach) return bad("Breach not found", 404);

  const id = newId("comm");
  const t = nowIso();
  const subject = b.subject ?? "";

  // Attempt a real send for channels that have a provider behind them.
  let status: "queued" | "sent" | "failed" | "logged" = b.channel === "inapp" ? "logged" : "logged";
  let provider_id: string | null = null;
  let provider_response: string | null = null;

  if (b.channel === "board_email" || b.channel === "user_email") {
    const r = await sendEmail(b.recipient, subject, b.message);
    if (r.status === "sent") {
      status = "sent";
      provider_id = r.provider_id ?? null;
      provider_response = JSON.stringify({ provider: "resend", provider_id: r.provider_id ?? null });
    } else if (r.status === "failed") {
      status = "failed";
      provider_response = JSON.stringify({ provider: "resend", error: r.error ?? "unknown error" });
    }
    // "not_configured" → keeps the honest "logged" behaviour.
  } else if (b.channel === "user_whatsapp") {
    const r = await sendWhatsApp(b.recipient, b.message);
    if (r.status === "sent") {
      status = "sent";
      provider_id = r.provider_id ?? null;
      provider_response = JSON.stringify({ provider: "whatsapp_webhook", provider_id: r.provider_id ?? null });
    } else if (r.status === "failed") {
      status = "failed";
      provider_response = JSON.stringify({ provider: "whatsapp_webhook", error: r.error ?? "unknown error" });
    }
    // "not_configured" → keeps the honest "logged" behaviour.
  }

  d.prepare(
    `INSERT INTO breach_comms (id, breach_id, channel, recipient, subject, body, status, created_at, sent_at, provider_id, provider_response)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, breachId, b.channel, b.recipient, subject, b.message, status, t, status === "sent" ? t : null, provider_id, provider_response);

  if (b.channel === "board_email" && status === "sent") {
    d.prepare("UPDATE breach_cases SET board_notified_at = ? WHERE id = ?").run(t, breachId);
  }
  if (["user_email", "user_whatsapp", "inapp"].includes(b.channel) && status === "sent") {
    d.prepare("UPDATE breach_cases SET users_notified_at = COALESCE(users_notified_at, ?) WHERE id = ?").run(t, breachId);
  }

  record("breach.notified", "breach_case", breachId,
    `Notification ${status} via ${b.channel} to ${b.recipient} for ${breach.code}`,
    { channel: b.channel, recipient: b.recipient, comm_id: id, status, provider_id }, "dpo");
  return ok({ id, status, logged_at: t, provider_id }, 201);
}

/** GET /api/incidents/:id/notify — notification log for a breach, with live sender status. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: breachId } = await params;
  const rows = db().prepare(`SELECT * FROM breach_comms WHERE breach_id = ? ORDER BY created_at DESC`).all(breachId);
  return ok({ comms: rows, sender_status: getSenderStatus() });
}
