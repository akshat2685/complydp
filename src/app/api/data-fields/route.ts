import { q, qOne, run, ok, bad, body, record, newId } from "@/server/api";
import { classifyField } from "@/server/classify";

/** GET /api/data-fields?system_id= — field inventory with PII classification. */
export async function GET(req: Request) {
  const sysId = new URL(req.url).searchParams.get("system_id");
  const rows = (sysId
    ? await q(`SELECT f.*, s.name AS system_name, s.kind AS system_kind FROM data_fields f JOIN systems s ON s.id = f.system_id WHERE f.system_id = ? ORDER BY f.field_name`, sysId)
    : await q(`SELECT f.*, s.name AS system_name, s.kind AS system_kind FROM data_fields f JOIN systems s ON s.id = f.system_id ORDER BY s.name, f.field_name`)) as Array<Record<string, unknown>>;
  const acts = await q(`SELECT id, name FROM processing_activities`) as Array<{ id: string; name: string }>;
  const actName: Record<string, string> = {};
  for (const a of acts) actName[a.id] = a.name;
  return ok({
    fields: rows.map((f) => ({ ...f, activity_name: actName[f.mapped_activity_id as string] ?? null })),
  });
}

interface FieldBody {
  system_id: string;
  field_name: string;
  note?: string;
}

/** POST /api/data-fields — add a field; auto-classified by the rule engine. */
export async function POST(req: Request) {
  const b = await body<FieldBody>(req);
  if (!b?.system_id || !b?.field_name) return bad("system_id and field_name are required");
  const c = classifyField(b.field_name);
  const id = newId("fld");
  await run(`INSERT INTO data_fields (id, system_id, field_name, pii_category, classification_source, mapped_activity_id, note)
     VALUES (?, ?, ?, ?, 'auto', '', ?)`, id, b.system_id, b.field_name.trim(), c.category, b.note ?? "");
  await record("field.classified", "data_field", id, `Field ${b.field_name} classified as ${c.label} (rule-based)`, {
    category: c.category,
    reason: c.reason,
  });
  return ok({ id, classification: c }, 201);
}

/** PATCH /api/data-fields — override classification or map to an activity. */
export async function PATCH(req: Request) {
  const b = await body<{ id: string; pii_category?: string; mapped_activity_id?: string }>(req);
  if (!b?.id) return bad("id is required");
  const row = await qOne("SELECT * FROM data_fields WHERE id = ?", b.id) as Record<string, unknown> | undefined;
  if (!row) return bad("Field not found", 404);
  const updates: string[] = [];
  const params: unknown[] = [];
  if (b.pii_category) {
    updates.push("pii_category = ?");
    params.push(b.pii_category);
    updates.push("classification_source = 'manual'");
  }
  if (typeof b.mapped_activity_id === "string") {
    updates.push("mapped_activity_id = ?");
    params.push(b.mapped_activity_id);
  }
  if (!updates.length) return bad("Nothing to update");
  params.push(b.id);
  await run(`UPDATE data_fields SET ${updates.join(", ")} WHERE id = ?`, ...(params as []));
  await record("field.updated", "data_field", b.id, `Field ${row.field_name} updated`, {
    pii_category: b.pii_category ?? row.pii_category,
    mapped_activity_id: b.mapped_activity_id ?? row.mapped_activity_id,
  });
  return ok({ id: b.id });
}
