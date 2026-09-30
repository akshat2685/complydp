import { qOne, run, newId, nowIso, ledgerAppend } from "@/server/db";
import { ok, bad, body } from "@/server/api";

/**
 * POST /api/setup — first-run workspace setup. Creates the deployment's
 * real tenant (company) plus its first property, and writes the first
 * evidence-ledger entry (tenant.created, chained from GENESIS).
 *
 * Auth: gated by the admin key via middleware (NOT a public route) — only
 * the deployer can claim the workspace. Idempotent-guarded: 409 when a
 * tenant already exists.
 */
interface SetupBody {
  company_name?: string;
  domain?: string;
  dpo_name?: string;
  dpo_email?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*\.[a-z]{2,}$/i;

export async function POST(req: Request) {
  const existing = await qOne<{ id: string }>(`SELECT id FROM tenant LIMIT 1`);
  if (existing) return bad("Workspace is already set up", 409);

  const b = await body<SetupBody>(req);
  const company = (b?.company_name ?? "").trim();
  const domain = (b?.domain ?? "").trim().toLowerCase();
  const dpoName = (b?.dpo_name ?? "").trim();
  const dpoEmail = (b?.dpo_email ?? "").trim().toLowerCase();

  if (company.length < 2 || company.length > 120) return bad("company_name must be 2–120 characters");
  if (!DOMAIN_RE.test(domain)) return bad("domain must be a valid domain (e.g. example.com)");
  if (dpoName.length < 2 || dpoName.length > 120) return bad("dpo_name must be 2–120 characters");
  if (!EMAIL_RE.test(dpoEmail)) return bad("dpo_email must be a valid email address");

  const t = nowIso();
  const tenantId = newId("tenant");
  const propertyId = newId("prop");

  const settings = {
    age_gating: true,
    notice_version: "v1.0",
    banner: {
      title: "We value your privacy",
      text: `${company} uses cookies to run this site and — with your permission — to measure and personalise. Read our Privacy Notice.`,
      accept_label: "Accept all",
      reject_label: "Reject non-essential",
      customize_label: "Customise",
      position: "bottom",
      theme: "paper",
    },
    form_branding: { heading: "Exercise your privacy rights", accent: "seal" },
  };

  await run(
    `INSERT INTO tenant (id, name, domain, dpo_name, dpo_email, settings_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    tenantId, company, domain, dpoName, dpoEmail, JSON.stringify(settings), t
  );
  await run(
    `INSERT INTO properties (id, tenant_id, domain, display_name, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    propertyId, tenantId, domain, `${company} — Website`, t
  );

  // First real evidence: the workspace creation itself is chained from GENESIS.
  await ledgerAppend({
    actor: "admin",
    action: "tenant.created",
    entity_type: "tenant",
    entity_id: tenantId,
    summary: `Workspace created for ${company}`,
    details: { domain },
  });

  return ok({ ok: true, tenant_id: tenantId, property_id: propertyId }, 201);
}

/** GET /api/setup — has the workspace been set up yet? */
export async function GET() {
  const existing = await qOne<{ id: string }>(`SELECT id FROM tenant LIMIT 1`);
  return ok({ setup_complete: !!existing });
}
