import { qOne, run, ok, bad, body, record, parseJson, cors, corsPreflight, getTenantId, getDefaultPropertyId } from "@/server/api";

/** GET /api/consent/config — banner config + age-gating toggle. */
export async function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  const tid = await getTenantId();
  if (!tid) return bad("Workspace is not set up yet", 503);
  const t = await qOne("SELECT * FROM tenant WHERE id = ?", tid) as Record<string, unknown>;
  const settings = parseJson(t.settings_json as string, {});
  const propId = await getDefaultPropertyId();
  const prop = propId ? await qOne("SELECT * FROM properties WHERE id = ?", propId) : null;
  return cors(ok({ tenant: { ...t, settings }, property: prop }));
}

/** PUT /api/consent/config — update banner config / age gating. */
export async function PUT(req: Request) {
  const b = await body<{ age_gating?: boolean; banner?: Record<string, unknown>; notice_version?: string }>(req);
  if (!b) return bad("Invalid JSON body");
  const tid = await getTenantId();
  if (!tid) return bad("Workspace is not set up yet", 503);
  const t = await qOne("SELECT settings_json FROM tenant WHERE id = ?", tid) as { settings_json: string };
  const settings = parseJson<Record<string, unknown>>(t.settings_json, {});
  const next = { ...settings };
  if (typeof b.age_gating === "boolean") next.age_gating = b.age_gating;
  if (b.banner) next.banner = { ...(settings.banner as object), ...b.banner };
  if (b.notice_version) next.notice_version = b.notice_version;
  await run("UPDATE tenant SET settings_json = ? WHERE id = ?", JSON.stringify(next), tid);
  const propId = await getDefaultPropertyId();
  await record("consent.config_updated", "property", propId ?? tid, "Consent configuration updated", {
    age_gating: next.age_gating,
    notice_version: next.notice_version,
  });
  return ok({ settings: next });
}
