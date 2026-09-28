import { db, ok, bad } from "@/server/api";
import { seedDemoTenant } from "@/server/seed";
import { ledgerAppend } from "@/server/db";

/**
 * POST /api/admin/reset — wipe all registry data and reseed the demo tenant.
 * The DB handle stays open; full-table deletes are WAL-safe.
 */
export async function POST() {
  const d = db();
  try {
    // FK-safe order: children first.
    const tables = [
      "breach_comms",
      "consent_events",
      "cookies",
      "scans",
      "activity_vendors",
      "data_fields",
      "dsr_cases",
      "breach_cases",
      "findings",
      "evidence_ledger",
      "notices",
      "processing_activities",
      "systems",
      "vendors",
      "properties",
      "tenant",
    ];
    for (const t of tables) {
      d.prepare(`DELETE FROM ${t}`).run();
    }
    // Restart the ledger sequence so a fresh seed reads seq 1..N.
    d.prepare(`DELETE FROM sqlite_sequence WHERE name = 'evidence_ledger'`).run();

    seedDemoTenant(d);

    // The reset itself is evidence: it gets its own chained entry.
    ledgerAppend(d, {
      actor: "admin",
      action: "admin.reset",
      entity_type: "tenant",
      entity_id: "tenant_meridian",
      summary: "Demo data reset to seed state",
      details: {},
    });

    const n = (d.prepare("SELECT COUNT(*) AS n FROM evidence_ledger").get() as { n: number }).n;
    return ok({ ok: true, ledger_entries: n });
  } catch (e) {
    return bad(`Reset failed: ${e instanceof Error ? e.message : "unknown error"}`, 500);
  }
}
