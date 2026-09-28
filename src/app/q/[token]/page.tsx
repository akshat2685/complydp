import { db, parseJson } from "@/server/db";
import { Seal, EmptyState } from "@/components/ui";
import { notFound } from "next/navigation";
import { QuestionnaireFormClient } from "./QuestionnaireFormClient";

/**
 * Every token is a different DB lookup and the status flips to "responded"
 * after submission — this page can never be meaningfully prerendered.
 */
export const dynamic = "force-dynamic";

export default async function PublicQuestionnairePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const d = db();

  // The token is the auth — an unknown token is a 404, not a login prompt.
  const q = d.prepare("SELECT * FROM questionnaires WHERE token = ?").get(token) as
    | { id: string; vendor_id: string; status: string }
    | undefined;

  if (!q) {
    notFound();
  }

  const vendor = d.prepare("SELECT * FROM vendors WHERE id = ?").get(q.vendor_id) as
    | { id: string; name: string; category: string }
    | undefined;

  const tenant = d.prepare("SELECT * FROM tenant LIMIT 1").get() as {
    name: string;
    domain: string;
    dpo_email: string;
    settings_json: string;
  } | undefined;
  const settings = parseJson<{ form_branding?: { heading?: string } }>(tenant?.settings_json ?? "", {});
  const heading =
    settings.form_branding?.heading ?? "Vendor data-protection assessment";

  if (q.status === "responded") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <EmptyState
            title="Already submitted"
            body={`Thanks — ${vendor?.name ?? "your team"} already submitted this questionnaire. Nothing more to do.`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
        {/* Masthead */}
        <div className="text-center mb-7">
          <div className="flex justify-center mb-3">
            <Seal size={44} />
          </div>
          <div className="kicker mb-1.5">{tenant?.name ?? "Pramaan"}</div>
          <h1 className="font-display text-[26px] sm:text-[30px] font-bold text-ink tracking-tight leading-tight">
            {heading}
          </h1>
          <p className="text-[13.5px] text-ink-muted mt-2 max-w-md mx-auto leading-relaxed">
            {vendor?.name ?? "Your vendor"}
            {vendor?.category ? ` (${vendor.category})` : ""} is being assessed under
            India's Digital Personal Data Protection Act, 2023. Please answer every
            required question — your answers are recorded as evidence.
          </p>
        </div>

        <QuestionnaireFormClient token={token} vendorName={vendor?.name ?? "your vendor"} />

        <footer className="text-center mt-8">
          {tenant?.dpo_email && (
            <p className="text-[11.5px] text-ink-faint">
              Questions? Write to{" "}
              <a
                href={`mailto:${tenant.dpo_email}`}
                className="underline underline-offset-2 hover:text-ink-muted"
              >
                {tenant.dpo_email}
              </a>
            </p>
          )}
          <p className="font-mono text-[10.5px] text-ink-faint mt-1.5">
            Secured by Pramaan · evidence-first privacy
          </p>
        </footer>
      </div>
    </div>
  );
}
