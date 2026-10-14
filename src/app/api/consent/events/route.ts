import { q, qOne, ok, bad, body, record, parseJson, cors, corsPreflight, getTenantId, getDefaultPropertyId } from "@/server/api";
import { consentAppend } from "@/server/db";
import { checkRateLimit } from "@/server/ratelimit";
import { withApiLog } from "@/server/withApiLog";
import { requireAdmin } from "@/server/session";

async function OPTIONS_impl() {
  return corsPreflight();
}

/** GET /api/consent/events?property_id=&limit= — latest consent events, newest first. */
async function GET_impl(req: Request) {
  const __denied = await requireAdmin(req);
  if (__denied) return __denied;
  const url = new URL(req.url);
  const propertyId = url.searchParams.get("property_id") ?? await getDefaultPropertyId();
  if (!propertyId) return bad("Workspace is not set up yet", 503);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 500);
  const rows = await q(`SELECT * FROM consent_events WHERE property_id = ? ORDER BY created_at DESC LIMIT ?`, propertyId, limit) as Array<Record<string, unknown>>;
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
async function POST_impl(req: Request) {
  const __limited = await checkRateLimit(req, "public-write");
  if (__limited) return cors(__limited);
  const b = await body<ConsentBody>(req);
  if (!b?.visitor_hash || !b?.categories) return bad("visitor_hash and categories are required");

  const tid = await getTenantId();
  if (!tid) return bad("Workspace is not set up yet", 503);
  const tenant = await qOne("SELECT settings_json FROM tenant WHERE id = ?", tid) as { settings_json: string };
  const settings = parseJson<{ age_gating?: boolean }>(tenant.settings_json, {});
  let cats = b.categories;
  const band = b.age_band ?? "adult";
  // Age-gating enforcement: under-18 visitors get necessary-only, always.
  if (settings.age_gating && band === "under18") {
    cats = { necessary: true, functional: false, analytics: false, marketing: false };
  }

  const propertyId = b.property_id ?? await getDefaultPropertyId();
  if (!propertyId) return bad("Workspace is not set up yet", 503);
  const { id, event_hash } = await consentAppend({
    property_id: propertyId,
    visitor_hash: b.visitor_hash,
    age_band: band,
    categories: cats,
    consent_mode: b.consent_mode ?? "banner",
    notice_version: b.notice_version ?? "v2.3",
  });
  await record("consent.recorded", "consent_event", id, `Consent recorded (${band}, mode: ${b.consent_mode ?? "banner"})`, {
    categories: cats,
    event_hash,
  });
  return cors(ok({ id, event_hash, age_band: band, categories: cats }, 201));
}

async function DELETE_impl(req: Request) {
  const __denied = await requireAdmin(req);
  if (__denied) return __denied;
  return bad("Consent events are append-only evidence and cannot be deleted.", 405);
}

export const OPTIONS = withApiLog(OPTIONS_impl);
export const GET = withApiLog(GET_impl);
export const POST = withApiLog(POST_impl);
export const DELETE = withApiLog(DELETE_impl);
