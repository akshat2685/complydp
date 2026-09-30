import { q, run, ok, bad, body, record, newId, nowIso, parseJson } from "@/server/api";

/** GET /api/processing-activities — RoPA-style register with linked vendors. */
export async function GET() {
  const acts = await q(`SELECT * FROM processing_activities ORDER BY name`) as Array<Record<string, unknown>>;
  const links = await q(`SELECT av.activity_id, v.id, v.name, v.dpa_status FROM activity_vendors av JOIN vendors v ON v.id = av.vendor_id`) as Array<{ activity_id: string; id: string; name: string; dpa_status: string }>;
  const byAct: Record<string, Array<{ id: string; name: string; dpa_status: string }>> = {};
  for (const l of links) {
    (byAct[l.activity_id] ??= []).push({ id: l.id, name: l.name, dpa_status: l.dpa_status });
  }
  return ok({
    activities: acts.map((a) => ({
      ...a,
      data_subjects: parseJson(a.data_subjects_json as string, []),
      vendors: byAct[a.id as string] ?? [],
    })),
  });
}

/** POST /api/processing-activities — add an activity. */
export async function POST(req: Request) {
  const b = await body<{
    name: string; purpose?: string; owner_team?: string; data_subjects?: string[];
    lawful_basis?: string; retention?: string; vendor_ids?: string[];
  }>(req);
  if (!b?.name) return bad("name is required");
  const id = newId("act");
  await run(`INSERT INTO processing_activities (id, name, purpose, owner_team, data_subjects_json, lawful_basis, retention, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, id, b.name.trim(), b.purpose ?? "", b.owner_team ?? "", JSON.stringify(b.data_subjects ?? []), b.lawful_basis ?? "", b.retention ?? "", nowIso());
  for (const vid of b.vendor_ids ?? []) {
    try { await run(`INSERT INTO activity_vendors (activity_id, vendor_id) VALUES (?, ?)`, id, vid); } catch { /* ignore bad ids */ }
  }
  await record("activity.created", "processing_activity", id, `Processing activity created: ${b.name}`, {});
  return ok({ id }, 201);
}
