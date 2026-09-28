import { db, parseJson } from "@/server/db";
import { Seal, EmptyState } from "@/components/ui";
import { DsrFormClient } from "./DsrFormClient";

export default async function PublicDsrPage({ params }: { params: Promise<{ property: string }> }) {
  const { property } = await params;
  const d = db();

  const prop = d.prepare("SELECT * FROM properties WHERE id = ?").get(property) as
    | { id: string; tenant_id: string; domain: string; display_name: string }
    | undefined;

  if (!prop) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <EmptyState
            title="Unknown form link"
            body="This privacy-request link doesn't match any property we know. Please check the link on the website's privacy page and try again."
          />
        </div>
      </div>
    );
  }

  const tenant = d.prepare("SELECT * FROM tenant WHERE id = ?").get(prop.tenant_id) as {
    name: string;
    domain: string;
    dpo_email: string;
    settings_json: string;
  };
  const settings = parseJson<{ form_branding?: { heading?: string } }>(tenant.settings_json, {});
  const heading = settings.form_branding?.heading ?? "Exercise your privacy rights";

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
        {/* Masthead */}
        <div className="text-center mb-7">
          <div className="flex justify-center mb-3">
            <Seal size={44} />
          </div>
          <div className="kicker mb-1.5">{tenant.name}</div>
          <h1 className="font-display text-[26px] sm:text-[30px] font-bold text-ink tracking-tight leading-tight">
            {heading}
          </h1>
          <p className="text-[13.5px] text-ink-muted mt-2 max-w-md mx-auto leading-relaxed">
            Use this form to ask {tenant.name} about your personal data. No account or login
            needed — we'll verify it's really you over email.
          </p>
        </div>

        <DsrFormClient propertyId={prop.id} />

        <footer className="text-center mt-8">
          <p className="text-[11.5px] text-ink-faint">
            Questions? Write to{" "}
            <a href={`mailto:${tenant.dpo_email}`} className="underline underline-offset-2 hover:text-ink-muted">
              {tenant.dpo_email}
            </a>
          </p>
          <p className="font-mono text-[10.5px] text-ink-faint mt-1.5">
            Secured by Pramaan · evidence-first privacy
          </p>
        </footer>
      </div>
    </div>
  );
}
