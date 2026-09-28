import { db, ok, bad, body, record, newId, nowIso } from "@/server/api";

/** GET /api/findings?status= — attention queue. */
export async function GET(req: Request) {
  const status = new URL(req.url).searchParams.get("status");
  const rows = (status
    ? db().prepare(`SELECT * FROM findings WHERE status = ? ORDER BY created_at DESC`).all(status)
    : db().prepare(`SELECT * FROM findings ORDER BY CASE status WHEN 'needs_review' THEN 0 ELSE 1 END, created_at DESC`).all()) as Array<Record<string, unknown>>;
  return ok({ findings: rows });
}

/** PATCH /api/findings — resolve / reopen a finding. */
export async function PATCH(req: Request) {
  const b = await body<{ id: string; status?: string; resolution_note?: string }>(req);
  if (!b?.id) return bad("id is required");
  const d = db();
  const row = d.prepare("SELECT * FROM findings WHERE id = ?").get(b.id) as Record<string, unknown> | undefined;
  if (!row) return bad("Finding not found", 404);
  const status = b.status ?? "resolved";
  if (!["needs_review", "resolved", "dismissed"].includes(status)) return bad("Invalid status");
  const evidence = status === "resolved" ? newId("ev").replace("ev_", "") : "";
  d.prepare(`UPDATE findings SET status = ?, resolved_at = ?, resolution_note = ?, evidence_hash = ? WHERE id = ?`)
    .run(status, status === "resolved" ? nowIso() : null, b.resolution_note ?? "", evidence, b.id);
  record("finding.resolved", "finding", b.id, `Finding ${status}: ${row.title}`, { note: b.resolution_note ?? "" });
  return ok({ id: b.id, status });
}
