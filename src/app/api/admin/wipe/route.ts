import { run, ok, bad } from "@/server/api";

/**
 * POST /api/admin/wipe — TEMPORARY ONE-TIME USE (2026-09-28).
 * Deletes all rows from the app tables to remove the old Meridian demo tenant.
 * Gated by the admin key via middleware. DELETE THIS FILE after the wipe.
 */
export async function POST() {
  // Delete in dependency order (children before parents).
  const TABLES = [
    "questionnaire_responses",
    "questionnaires",
    "activity_vendors",
    "breach_comms",
    "breach_cases",
    "guardian_consents",
    "consent_events",
    "cookies",
    "scans",
    "data_fields",
    "findings",
    "processing_activities",
    "notices",
    "dsr_cases",
    "vendors",
    "systems",
    "properties",
    "evidence_ledger",
    "tenant",
  ];
  const counts: Record<string, number> = {};
  for (const t of TABLES) {
    const r = await run(`DELETE FROM "${t}"`);
    counts[t] = r.changes;
  }
  return ok({ wiped: true, counts });
}
