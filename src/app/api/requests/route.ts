import { db, ok, bad, body, record, newId, nowIso, parseJson } from "@/server/api";
import { sendEmail } from "@/server/notify";

const DSR_TYPES = ["access", "correction", "deletion", "disclosure"] as const;
const SLA_HOURS: Record<string, number> = { access: 72, correction: 72, deletion: 72, disclosure: 72 };

/** GET /api/requests?status= — DSR cases. */
export async function GET(req: Request) {
  const status = new URL(req.url).searchParams.get("status");
  const rows = (status
    ? db().prepare(`SELECT * FROM dsr_cases WHERE status = ? ORDER BY created_at DESC`).all(status)
    : db().prepare(`SELECT * FROM dsr_cases ORDER BY created_at DESC`).all()) as Array<Record<string, unknown>>;
  return ok({
    requests: rows.map((r) => ({ ...r, tasks: parseJson(r.tasks_json as string, []) })),
  });
}

interface DsrBody {
  type: string;
  requester_name: string;
  requester_email: string;
  note?: string;
}

/** POST /api/requests — file a new DSR (used by the public hosted form). */
export async function POST(req: Request) {
  const b = await body<DsrBody>(req);
  if (!b?.type || !b?.requester_name || !b?.requester_email) {
    return bad("type, requester_name and requester_email are required");
  }
  if (!(DSR_TYPES as readonly string[]).includes(b.type)) return bad(`type must be one of ${DSR_TYPES.join(", ")}`);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.requester_email)) return bad("requester_email is not valid");

  const d = db();
  const n = (d.prepare("SELECT COUNT(*) AS n FROM dsr_cases").get() as { n: number }).n;
  const id = `DSR-2026-${String(43 + n).padStart(4, "0")}`;
  const created = nowIso();
  const sla = new Date(Date.now() + (SLA_HOURS[b.type] ?? 72) * 3600_000).toISOString();
  const tasks: string[] = ({
    access: ["Verify requester identity", "Pull records across systems", "Redact third-party data", "Send data package"],
    correction: ["Verify requester identity", "Validate corrected value", "Update source systems", "Confirm correction"],
    deletion: ["Verify requester identity", "Check retention overrides (tax/legal)", "Delete across systems & backups queue", "Confirm deletion"],
    disclosure: ["Verify requester identity", "List third parties data was shared with", "Send disclosure statement"],
  } as Record<string, string[]>)[b.type] ?? [];
  d.prepare(
    `INSERT INTO dsr_cases (id, type, requester_name, requester_email, note, status, assignee, sla_due_at, created_at, tasks_json)
     VALUES (?, ?, ?, ?, ?, 'new', '', ?, ?, ?)`
  ).run(id, b.type, b.requester_name.trim(), b.requester_email.trim().toLowerCase(), (b.note ?? "").trim(), sla, created,
    JSON.stringify(tasks.map((label) => ({ label, done: false }))));
  record("dsr.received", "dsr_case", id, `${b.type} request received from ${b.requester_name}`, { channel: "hosted_form" }, "public_form");
  return ok({ id, sla_due_at: sla }, 201);
}

/** PATCH /api/requests — update status / assignee / tasks / resolution. */
export async function PATCH(req: Request) {
  const b = await body<{
    id: string; status?: string; assignee?: string; tasks?: Array<{ label: string; done: boolean }>;
    resolution_note?: string;
  }>(req);
  if (!b?.id) return bad("id is required");
  const d = db();
  const row = d.prepare("SELECT * FROM dsr_cases WHERE id = ?").get(b.id) as Record<string, unknown> | undefined;
  if (!row) return bad("Case not found", 404);

  const updates: string[] = [];
  const params: unknown[] = [];
  if (b.status) {
    const allowed = ["new", "in_progress", "waiting", "resolved"];
    if (!allowed.includes(b.status)) return bad(`status must be one of ${allowed.join(", ")}`);
    updates.push("status = ?");
    params.push(b.status);
    if (b.status === "resolved") {
      updates.push("resolved_at = ?");
      params.push(nowIso());
    }
  }
  if (typeof b.assignee === "string") { updates.push("assignee = ?"); params.push(b.assignee); }
  if (b.tasks) { updates.push("tasks_json = ?"); params.push(JSON.stringify(b.tasks)); }
  if (typeof b.resolution_note === "string") { updates.push("resolution_note = ?"); params.push(b.resolution_note); }
  if (updates.length === 0) return bad("Nothing to update");
  params.push(b.id);
  d.prepare(`UPDATE dsr_cases SET ${updates.join(", ")} WHERE id = ?`).run(...(params as []));
  record("dsr.updated", "dsr_case", b.id, `DSR ${b.id} updated${b.status ? ` → ${b.status}` : ""}`, {
    status: b.status ?? row.status,
    assignee: b.assignee ?? row.assignee,
  });

  // DSR resolution notification: on a transition TO resolved, notify the
  // requester by email when an address is on file. The send never fails the
  // resolution itself — failures are caught, marked, and logged as evidence.
  let email_status: string | null = null;
  if (b.status === "resolved" && row.status !== "resolved") {
    const to = ((row.requester_email as string) ?? "").trim();
    const resolutionNote =
      typeof b.resolution_note === "string"
        ? b.resolution_note
        : ((row.resolution_note as string) ?? "");
    if (to) {
      const subject = `Your privacy request ${b.id} — resolved`;
      const emailBody = [
        `Your privacy request ${b.id} has been resolved.`,
        "",
        resolutionNote.trim()
          ? `Resolution: ${resolutionNote.trim()}`
          : "Our team has completed the work on your request.",
      ].join("\n");
      try {
        const r = await sendEmail(to, subject, emailBody);
        if (r.status === "sent") {
          email_status = "sent";
          record("dsr.resolution_notified", "dsr_case", b.id,
            `Resolution email sent to ${to} for ${b.id}`,
            { email_status: "sent", provider_id: r.provider_id ?? null }, "dpo");
        } else if (r.status === "not_configured") {
          email_status = "logged_not_configured";
          record("dsr.resolution_notified", "dsr_case", b.id,
            `Resolution for ${b.id} logged as evidence only — no email sender configured`,
            { email_status: "not_configured" }, "dpo");
        } else {
          email_status = `failed: ${r.error ?? "send failed"}`;
          record("dsr.resolution_notified", "dsr_case", b.id,
            `Resolution email to ${to} for ${b.id} failed`,
            { email_status: "failed", error: r.error ?? "send failed" }, "dpo");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "send error";
        email_status = `failed: ${msg}`;
        record("dsr.resolution_notified", "dsr_case", b.id,
          `Resolution email to ${to} for ${b.id} failed`,
          { email_status: "failed", error: msg }, "dpo");
      }
    } else {
      email_status = "no_email_on_file";
      record("dsr.resolution_notified", "dsr_case", b.id,
        `Resolution for ${b.id} completed — no requester email on file, nothing sent`,
        { email_status: "no_email_on_file" }, "dpo");
    }
  }

  return ok({ id: b.id, email_status });
}
