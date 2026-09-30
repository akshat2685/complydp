import { qOne, run, ok, bad, body, record, nowIso } from "@/server/api";

/**
 * PATCH /api/consent/guardian/:id — verify action: marks the guardian consent
 * as verified by the org (sets verified_at). Console-only, same-origin.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await body<{ action?: string }>(req);
  if (b?.action !== "verify") return bad("action must be 'verify'");

  const row = await qOne("SELECT * FROM guardian_consents WHERE id = ?", id) as | Record<string, unknown>
    | undefined;
  if (!row) return bad("Guardian consent not found", 404);
  if (row.verified_at) return ok({ id, verified_at: row.verified_at, already: true });

  const t = nowIso();
  await run("UPDATE guardian_consents SET verified_at = ? WHERE id = ?", t, id);
  await record(
    "guardian_consent.verified",
    "guardian_consent",
    id,
    `Guardian consent verified (${String(row.guardian_name)} for visitor ${String(row.visitor_hash).slice(0, 10)}…)`,
    { verified_at: t },
    "dpo"
  );
  return ok({ id, verified_at: t });
}
