import { db, ok, bad, body, record, newId, nowIso } from "@/server/api";
import { QUESTIONNAIRE_QUESTIONS } from "@/lib/questionnaire";

/** POST /api/q/:token — public vendor questionnaire submission.
 *
 *  No auth beyond the unguessable token (the token IS the auth for this
 *  public vendor form). Rate-limiting is intentionally out of scope for the
 *  MVP — revisit before opening this to the open internet.
 */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = db();

  const q = d.prepare("SELECT * FROM questionnaires WHERE token = ?").get(token) as
    | { id: string; vendor_id: string; token: string; status: string; created_at: string }
    | undefined;
  if (!q) return bad("Invalid questionnaire link", 404);
  if (q.status === "responded") return bad("This questionnaire has already been submitted", 409);

  const b = await body<{ answers?: Record<string, string> }>(req);
  const answers: Record<string, string> = {};
  for (const def of QUESTIONNAIRE_QUESTIONS) {
    const raw = b?.answers?.[def.id];
    answers[def.id] = typeof raw === "string" ? raw : "";
  }

  // Validate required questions and yes-no values server-side (the vendor's
  // browser does its own checks too, but the server is the boundary).
  const problems: string[] = [];
  for (const def of QUESTIONNAIRE_QUESTIONS) {
    const v = answers[def.id].trim();
    if (def.required && !v) problems.push(`"${def.label}"`);
    else if (def.type === "yes-no" && v && !["yes", "no"].includes(v.toLowerCase()))
      problems.push(`"${def.label}" must be answered yes or no`);
  }
  if (problems.length) return bad(`Please answer: ${problems.join("; ")}`);

  const rid = newId("qresp");
  const ts = nowIso();
  d.prepare(
    `INSERT INTO questionnaire_responses (id, questionnaire_id, answers_json, submitted_at)
     VALUES (?, ?, ?, ?)`
  ).run(rid, q.id, JSON.stringify(answers), ts);
  d.prepare("UPDATE questionnaires SET status = 'responded' WHERE id = ?").run(q.id);

  // Flip the vendor's DPA status from their answer. The vendors table has no
  // generic "status" column — dpa_status is the vendor lifecycle state.
  const vendor = d
    .prepare("SELECT id, name, dpa_status FROM vendors WHERE id = ?")
    .get(q.vendor_id) as { id: string; name: string; dpa_status: string } | undefined;
  const dpaAns = answers.dpa_signed.trim().toLowerCase();
  if (vendor) {
    if (dpaAns === "yes" && vendor.dpa_status !== "signed") {
      d.prepare("UPDATE vendors SET dpa_status = 'signed' WHERE id = ?").run(vendor.id);
    } else if (dpaAns === "no" && vendor.dpa_status === "not_started") {
      d.prepare("UPDATE vendors SET dpa_status = 'under_review' WHERE id = ?").run(vendor.id);
    }
  }

  record(
    "questionnaire.responded",
    "questionnaire",
    q.id,
    `Questionnaire response received${vendor ? ` from ${vendor.name}` : ""}`,
    {
      response_id: rid,
      dpa_signed: dpaAns || null,
      cross_border: answers.cross_border.trim() || null,
    },
    "public-form"
  );

  return ok({ id: rid, submitted_at: ts }, 201);
}
