import { db, ok, bad, body, record, parseJson, nowIso, cors, corsPreflight } from "@/server/api";
import { consentAppend } from "@/server/db";

export async function OPTIONS() {
  return corsPreflight();
}

/** GET /api/consent/events?property_id=&limit= — latest consent events, newest first. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const propertyId = url.searchParams.get("property_id") ?? "prop_main";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 500);
  const rows = db()
    .prepare(`SELECT * FROM consent_events WHERE property_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(propertyId, limit) as Array<Record<string, unknown>>;
  return ok({
    events: rows.map((r) => ({ ...r, categories: parseJson(r.categories_json as string, {}) })),
    property_id: propertyId,
  });
}

interface ConsentBody {
  property_id?: string;
  visitor_hash: string;
  age_band?: "adult" | "under18";
  categories: { necessary: boolean; functional: boolean; analytics: boolean; marketing: boolean };
  consent_mode?: string;
  notice_version?: string;
}

/** POST /api/consent/events — record a consent choice (hash-chained). */
export async function POST(req: Request) {
  const b = await body<ConsentBody>(req);
  if (!b?.visitor_hash || !b?.categories) return bad("visitor_hash and categories are required");

  const tenant = db().prepare("SELECT settings_json FROM tenant WHERE id = 'tenant_meridian'").get() as { settings_json: string };
  const settings = parseJson<{ age_gating?: boolean }>(tenant.settings_json, {});
  let cats = b.categories;
  const band = b.age_band ?? "adult";
  // Age-gating enforcement: under-18 visitors get necessary-only, always.
  if (settings.age_gating && band === "under18") {
    cats = { necessary: true, functional: false, analytics: false, marketing: false };
  }

  const { id, event_hash } = consentAppend(db(), {
    property_id: b.property_id ?? "prop_main",
    visitor_hash: b.visitor_hash,
    age_band: band,
    categories: cats,
    consent_mode: b.consent_mode ?? "banner",
    notice_version: b.notice_version ?? "v2.3",
  });
  record("consent.recorded", "consent_event", id, `Consent recorded (${band}, mode: ${b.consent_mode ?? "banner"})`, {
    categories: cats,
    event_hash,
  });
  return cors(ok({ id, event_hash, age_band: band, categories: cats }, 201));
}

export async function DELETE() {
  return bad("Consent events are append-only evidence and cannot be deleted.", 405);
}
void nowIso;
