import { qOne, ok, bad, parseJson, getTenantId, getDefaultPropertyId } from "@/server/api";

/** GET /api/properties — tenant + web property summary. */
export async function GET() {
  const tid = await getTenantId();
  if (!tid) return bad("Workspace is not set up yet", 503);
  const t = await qOne("SELECT * FROM tenant WHERE id = ?", tid) as Record<string, unknown>;
  const settings = parseJson(t.settings_json as string, {});
  const propId = await getDefaultPropertyId();
  const prop = propId ? await qOne("SELECT * FROM properties WHERE id = ?", propId) : null;
  const counts: Record<string, number> = {};
  const propCounts: Array<[string, string]> = [
    ["cookies", "SELECT COUNT(*) AS n FROM cookies WHERE property_id = ?"],
    ["consent_events", "SELECT COUNT(*) AS n FROM consent_events WHERE property_id = ?"],
  ];
  const globalCounts: Array<[string, string]> = [
    ["open_dsr", "SELECT COUNT(*) AS n FROM dsr_cases WHERE status != 'resolved'"],
    ["open_breaches", "SELECT COUNT(*) AS n FROM breach_cases WHERE status = 'open'"],
    ["findings", "SELECT COUNT(*) AS n FROM findings WHERE status = 'needs_review'"],
    ["vendors", "SELECT COUNT(*) AS n FROM vendors"],
    ["systems", "SELECT COUNT(*) AS n FROM systems"],
    ["fields", "SELECT COUNT(*) AS n FROM data_fields"],
  ];
  for (const [k, sql] of propCounts) {
    counts[k] = propId ? (await qOne(sql, propId) as { n: number }).n : 0;
  }
  for (const [k, sql] of globalCounts) {
    counts[k] = (await qOne(sql) as { n: number }).n;
  }
  return ok({ tenant: { ...t, settings }, property: prop, counts });
}
