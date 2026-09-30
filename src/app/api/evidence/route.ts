import { q, ok, bad, body, record, newId, nowIso, parseJson, ledgerVerify } from "@/server/api";

/**
 * GET /api/evidence — the evidence ledger.
 * ?entity_type=&entity_id= filters; ?verify=1 runs a full chain check.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("verify") === "1") {
    const v = await ledgerVerify();
    return ok({ verify: v });
  }
  const et = url.searchParams.get("entity_type");
  const eid = url.searchParams.get("entity_id");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 500);
  let rows: Array<Record<string, unknown>>;
  if (et && eid) {
    rows = await q(`SELECT * FROM evidence_ledger WHERE entity_type = ? AND entity_id = ? ORDER BY seq DESC LIMIT ?`, et, eid, limit) as Array<Record<string, unknown>>;
  } else {
    rows = await q(`SELECT * FROM evidence_ledger ORDER BY seq DESC LIMIT ?`, limit) as Array<Record<string, unknown>>;
  }
  const v = await ledgerVerify();
  return ok({
    chain: { ok: v.ok, checked: v.checked, broken_at: v.brokenAt ?? null },
    entries: rows.map((r) => ({ ...r, details: parseJson(r.details_json as string, {}) })),
  });
}

interface ExportBody {
  entity_type: string;
  entity_id: string;
  format?: "json" | "pack";
}

/**
 * POST /api/evidence — export an evidence pack: the entity's ledger entries
 * plus a chain verification receipt. This is the "proof" artifact.
 */
export async function POST(req: Request) {
  const b = await body<ExportBody>(req);
  if (!b?.entity_type || !b?.entity_id) return bad("entity_type and entity_id are required");
  const rows = await q(`SELECT seq, ts, actor, action, entity_type, entity_id, summary, details_json, prev_hash, entry_hash
     FROM evidence_ledger WHERE entity_type = ? AND entity_id = ? ORDER BY seq ASC`, b.entity_type, b.entity_id) as Array<Record<string, unknown>>;
  const v = await ledgerVerify();
  const pack = {
    exported_at: nowIso(),
    entity: { type: b.entity_type, id: b.entity_id },
    chain_verification: { ok: v.ok, entries_checked: v.checked },
    entries: rows.map((r) => ({ ...r, details: parseJson(r.details_json as string, {}) })),
  };
  await record("evidence.exported", b.entity_type, b.entity_id, `Evidence pack exported (${rows.length} entries)`, {
    chain_ok: v.ok,
  });
  return ok({ pack });
}

export async function DELETE() {
  return bad("The evidence ledger is append-only and cannot be modified.", 405);
}
void record;
void newId;
void nowIso;
