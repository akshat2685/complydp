import { q, qOne, run, ok, bad, body, record, newId, nowIso } from "@/server/api";

/** GET /api/vendors — vendor register. */
export async function GET() {
  const rows = await q(`SELECT * FROM vendors ORDER BY risk_tier DESC, name`);
  return ok({ vendors: rows });
}

/** POST /api/vendors — register a vendor. */
export async function POST(req: Request) {
  const b = await body<{ name: string; category?: string; domain?: string; country?: string; owner?: string }>(req);
  if (!b?.name) return bad("name is required");
  const id = newId("ven");
  await run(`INSERT INTO vendors (id, name, category, domain, country, dpa_status, risk_tier, owner, discovered_via, created_at)
     VALUES (?, ?, ?, ?, ?, 'not_started', 'medium', ?, 'manual', ?)`, id, b.name.trim(), b.category ?? "", b.domain ?? "", b.country ?? "India", b.owner ?? "", nowIso());
  await record("vendor.registered", "vendor", id, `Vendor registered: ${b.name}`, { dpa_status: "not_started" });
  return ok({ id }, 201);
}

/** PATCH /api/vendors — update DPA status / risk / owner / notes. */
export async function PATCH(req: Request) {
  const b = await body<{ id: string; dpa_status?: string; risk_tier?: string; owner?: string; notes?: string; category?: string }>(req);
  if (!b?.id) return bad("id is required");
  const row = await qOne("SELECT * FROM vendors WHERE id = ?", b.id) as Record<string, unknown> | undefined;
  if (!row) return bad("Vendor not found", 404);
  const updates: string[] = [];
  const params: unknown[] = [];
  const set = (col: string, v: unknown) => { updates.push(`${col} = ?`); params.push(v); };
  if (b.dpa_status) {
    if (!["not_started", "under_review", "signed", "not_required"].includes(b.dpa_status)) return bad("Invalid dpa_status");
    set("dpa_status", b.dpa_status);
  }
  if (b.risk_tier) set("risk_tier", b.risk_tier);
  if (typeof b.owner === "string") set("owner", b.owner);
  if (typeof b.notes === "string") set("notes", b.notes);
  if (typeof b.category === "string") set("category", b.category);
  if (!updates.length) return bad("Nothing to update");
  params.push(b.id);
  await run(`UPDATE vendors SET ${updates.join(", ")} WHERE id = ?`, ...(params as []));
  await record("vendor.updated", "vendor", b.id, `Vendor ${row.name} updated`, { dpa_status: b.dpa_status ?? row.dpa_status });
  return ok({ id: b.id });
}
