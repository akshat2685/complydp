import crypto from "node:crypto";
import { qOne, run, ok, bad, record, newId, nowIso } from "@/server/api";

/** POST /api/vendors/:id/questionnaire — send a DPDP questionnaire to a vendor.
 *  Creates a questionnaire row with an unguessable token and returns the
 *  public link (/qn/[token]). The token is the auth for the public form.
 *  Each send creates a fresh questionnaire, so a vendor can be re-assessed.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await qOne("SELECT * FROM vendors WHERE id = ?", id) as { id: string; name: string } | undefined;
  if (!vendor) return bad("Vendor not found", 404);

  const token = `${newId("qn")}_${crypto.randomBytes(24).toString("hex")}`;
  const qid = newId("qnr");
  await run(`INSERT INTO questionnaires (id, vendor_id, token, status, created_at)
     VALUES (?, ?, ?, 'sent', ?)`, qid, id, token, nowIso());

  await record("questionnaire.sent", "vendor", id, `Vendor questionnaire sent to ${vendor.name}`, {
    questionnaire_id: qid,
  });

  return ok({ id: qid, token, link: `/qn/${token}` }, 201);
}

/** GET /api/vendors/:id/questionnaire — latest questionnaire (+response) for a vendor. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await qOne("SELECT id FROM vendors WHERE id = ?", id);
  if (!vendor) return bad("Vendor not found", 404);

  const qn = await qOne("SELECT * FROM questionnaires WHERE vendor_id = ? ORDER BY created_at DESC LIMIT 1", id) as | { id: string; vendor_id: string; token: string; status: string; created_at: string }
    | undefined;
  if (!qn) return ok({ questionnaire: null });

  const r = await qOne("SELECT * FROM questionnaire_responses WHERE questionnaire_id = ? ORDER BY submitted_at DESC LIMIT 1", qn.id) as { id: string; answers_json: string; submitted_at: string } | undefined;

  return ok({
    questionnaire: {
      id: qn.id,
      status: qn.status,
      token: qn.token,
      link: `/qn/${qn.token}`,
      created_at: qn.created_at,
      submitted_at: r?.submitted_at ?? null,
      answers: r ? JSON.parse(r.answers_json) : null,
    },
  });
}
