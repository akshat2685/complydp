import { db, ok, parseJson } from "@/server/api";

/** GET /api/properties — tenant + web property summary. */
export async function GET() {
  const d = db();
  const t = d.prepare("SELECT * FROM tenant WHERE id = 'tenant_meridian'").get() as Record<string, unknown>;
  const settings = parseJson(t.settings_json as string, {});
  const prop = d.prepare("SELECT * FROM properties WHERE id = 'prop_main'").get();
  const counts: Record<string, number> = {};
  for (const [k, sql] of Object.entries({
    cookies: "SELECT COUNT(*) AS n FROM cookies WHERE property_id = 'prop_main'",
    consent_events: "SELECT COUNT(*) AS n FROM consent_events WHERE property_id = 'prop_main'",
    open_dsr: "SELECT COUNT(*) AS n FROM dsr_cases WHERE status != 'resolved'",
    open_breaches: "SELECT COUNT(*) AS n FROM breach_cases WHERE status = 'open'",
    findings: "SELECT COUNT(*) AS n FROM findings WHERE status = 'needs_review'",
    vendors: "SELECT COUNT(*) AS n FROM vendors",
    systems: "SELECT COUNT(*) AS n FROM systems",
    fields: "SELECT COUNT(*) AS n FROM data_fields",
  })) {
    counts[k] = (d.prepare(sql).get() as { n: number }).n;
  }
  return ok({ tenant: { ...t, settings }, property: prop, counts });
}
