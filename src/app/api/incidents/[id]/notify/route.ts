import { db, ok, bad, body, record, newId, nowIso } from "@/server/api";

interface NotifyBody {
  channel: "board_email" | "user_email" | "user_whatsapp" | "inapp";
  recipient: string;
  subject?: string;
  message: string;
}

/**
 * POST /api/incidents/:id/notify — log a breach notification.
 *
 * MVP honesty: this LOGS the notification as tamper-evident evidence
 * (what was sent, to whom, when). No real email/WhatsApp sender is wired —
 * connect one in Settings before this becomes a real send.
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
  d.prepare(
    `INSERT INTO breach_comms (id, breach_id, channel, recipient, subject, body, status, created_at, sent_at)
     VALUES (?, ?, ?, ?, ?, ?, 'logged', ?, ?)`
  ).run(id, breachId, b.channel, b.recipient, b.subject ?? "", b.message, t, t);

  if (b.channel === "board_email") {
    d.prepare("UPDATE breach_cases SET board_notified_at = ? WHERE id = ?").run(t, breachId);
  }
  if (["user_email", "user_whatsapp", "inapp"].includes(b.channel)) {
    d.prepare("UPDATE breach_cases SET users_notified_at = COALESCE(users_notified_at, ?) WHERE id = ?").run(t, breachId);
  }

  record("breach.notified", "breach_case", breachId,
    `Notification logged via ${b.channel} to ${b.recipient} for ${breach.code}`,
    { channel: b.channel, recipient: b.recipient, comm_id: id }, "dpo");
  return ok({ id, status: "logged", logged_at: t }, 201);
}

/** GET /api/incidents/:id/notify — notification log for a breach. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: breachId } = await params;
  const rows = db().prepare(`SELECT * FROM breach_comms WHERE breach_id = ? ORDER BY created_at DESC`).all(breachId);
  return ok({ comms: rows, sender_status: "not_configured — notifications are logged as evidence only" });
}
