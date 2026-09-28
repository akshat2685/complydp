import { q, run, ok, bad, body, record, newId, nowIso, cors, corsPreflight, getDefaultPropertyId } from "@/server/api";
import { sha256 } from "@/server/db";

export async function OPTIONS() {
  return corsPreflight();
}

const RELATIONSHIPS = ["Parent", "Guardian", "Other"] as const;

function validContact(c: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) || /^\+?[0-9\s\-()]{7,20}$/.test(c);
}

/** GET /api/consent/guardian?property_id= — newest first. Console-only (same-origin, no CORS). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const propertyId = url.searchParams.get("property_id") ?? await getDefaultPropertyId();
  if (!propertyId) return bad("Workspace is not set up yet", 503);
  const rows = await q(`SELECT * FROM guardian_consents WHERE property_id = ? ORDER BY created_at DESC LIMIT 500`, propertyId) as Array<Record<string, unknown>>;
  // node:sqlite rows carry a null prototype — normalize before JSON output.
  return ok({ consents: JSON.parse(JSON.stringify(rows)), property_id: propertyId });
}

interface GuardianBody {
  property_id?: string;
  visitor_hash: string;
  guardian_name: string;
  relationship: string;
  contact: string;
  consent_given: boolean;
}

/**
 * POST /api/consent/guardian — record a parent/guardian consent for an under-18 visitor.
 *
 * Called cross-site from the consent snippet, so CORS is applied (same as
 * /api/consent/events). The raw contact is stored so the org can reach
 * guardians; the evidence ledger carries ONLY contact_hash — never the contact.
 */
export async function POST(req: Request) {
  const b = await body<GuardianBody>(req);
  if (!b) return cors(bad("Invalid JSON body"));
  const propertyId = (b.property_id ?? (await getDefaultPropertyId()) ?? "").trim();
  if (!propertyId) return cors(bad("property_id is required"));
  if (!b.visitor_hash?.trim()) return cors(bad("visitor_hash is required"));
  if (!b.guardian_name?.trim()) return cors(bad("guardian_name is required"));
  if (!(RELATIONSHIPS as readonly string[]).includes(b.relationship)) {
    return cors(bad("relationship must be one of: Parent, Guardian, Other"));
  }
  if (!b.contact?.trim() || !validContact(b.contact.trim())) {
    return cors(bad("contact must be a valid email or phone number"));
  }
  if (b.consent_given !== true) {
    return cors(bad("consent_given must be true — the guardian must actively consent"));
  }

  const id = newId("gcn");
  const t = nowIso();
  const contact = b.contact.trim();
  const contactHash = sha256(contact);
  await run(`INSERT INTO guardian_consents
       (id, property_id, visitor_hash, guardian_name, relationship, contact, contact_hash, consent_given, verified_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, NULL, ?)`, id, propertyId, b.visitor_hash.trim(), b.guardian_name.trim(), b.relationship, contact, contactHash, t);

  // Ledger entry references the guardian consent id + contact_hash. The raw
  // contact never leaves guardian_consents.
  await record(
    "guardian_consent.recorded",
    "guardian_consent",
    id,
    `Guardian consent recorded (${b.relationship.toLowerCase()} of visitor ${b.visitor_hash.trim().slice(0, 10)}…)`,
    {
      property_id: propertyId,
      visitor_hash: b.visitor_hash.trim(),
      guardian_name: b.guardian_name.trim(),
      relationship: b.relationship,
      contact_hash: contactHash,
    },
    "visitor"
  );

  return cors(ok({ id, contact_hash: contactHash, verified_at: null }, 201));
}
