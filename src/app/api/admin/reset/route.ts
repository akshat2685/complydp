import { qOne, run, ok, bad } from "@/server/api";
import { seedDemoTenant } from "@/server/seed";
import { db, ledgerAppend } from "@/server/db";

/**
 * POST /api/admin/reset — wipe all registry data and reseed the demo tenant.
 * The DB handle stays open; full-table deletes are WAL-safe.
 */
export async function POST() {
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
      await run(`DELETE FROM ${t}`);
    }
    // Restart the ledger sequence so a fresh seed reads seq 1..N.
    await run(`DELETE FROM sqlite_sequence WHERE name = 'evidence_ledger'`);

    await seedDemoTenant(await db());

    // The reset itself is evidence: it gets its own chained entry.
    await ledgerAppend({
      actor: "admin",
      action: "admin.reset",
      entity_type: "tenant",
      entity_id: "tenant_meridian",
      summary: "Demo data reset to seed state",
      details: {},
    });

    const n = (await qOne("SELECT COUNT(*) AS n FROM evidence_ledger") as { n: number }).n;
    return ok({ ok: true, ledger_entries: n });
  } catch (e) {
    return bad(`Reset failed: ${e instanceof Error ? e.message : "unknown error"}`, 500);
  }
}
