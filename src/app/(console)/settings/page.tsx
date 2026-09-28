import { db, parseJson } from "@/server/db";
import { GET as healthCheck } from "@/app/api/health/route";
import { PageHead, Card, CardTitle, Chip } from "@/components/ui";
import { DangerZone } from "./DangerZone";

interface Capabilities {
  persistence: string;
  evidence_chain: string;
  cookie_scan: string;
  pii_classification: string;
  github_scan: string;
  notifications: string;
}

const CAPABILITY_LABELS: Array<[keyof Capabilities, string]> = [
  ["persistence", "Persistence"],
  ["evidence_chain", "Evidence chain"],
  ["cookie_scan", "Cookie scan"],
  ["pii_classification", "PII classification"],
  ["github_scan", "GitHub scan"],
  ["notifications", "Notifications"],
];

export default async function SettingsPage() {
  const d = db();
  const tenant = d.prepare(`SELECT * FROM tenant WHERE id = 'tenant_meridian'`).get() as {
    name: string;
    domain: string;
    dpo_name: string;
    dpo_email: string;
    settings_json: string;
  };
  const settings = parseJson<{ age_gating?: boolean; notice_version?: string }>(tenant.settings_json, {});

  const healthRes = await healthCheck();
  const health = (await healthRes.json()) as { capabilities: Capabilities; evidence_ledger: { entries: number; chain: string } };
  const caps = health.capabilities;

  return (
    <div>
      <PageHead
        kicker="Settings"
        title="Workspace settings"
        lede="Tenant identity, what this build honestly does, and the demo reset switch."
      />

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Tenant */}
        <Card>
          <CardTitle>Tenant</CardTitle>
          <div className="divide-y divide-dashed divide-hairline">
            {[
              ["Organisation", tenant.name],
              ["Domain", tenant.domain],
              ["Data Protection Officer", tenant.dpo_name],
              ["DPO email", tenant.dpo_email],
              ["Privacy notice", `version ${settings.notice_version ?? "—"}`],
              ["Age gating", settings.age_gating ? "enabled — under-18 visitors get necessary-only cookies" : "disabled"],
            ].map(([k, v]) => (
              <div key={k} className="rule-row flex items-start justify-between gap-4 py-2">
                <span className="text-[12px] text-ink-muted shrink-0">{k}</span>
                <span className="text-[12.5px] text-ink font-medium text-right">{v}</span>
              </div>
            ))}
          </div>
          <p className="text-[11.5px] text-ink-faint mt-3">
            Tenant identity is read-only in this MVP. Changing it is a future release.
          </p>
        </Card>

        {/* Notifications */}
        <Card>
          <CardTitle
            right={
              <Chip tone="amber">not configured</Chip>
            }
          >
            Notifications
          </CardTitle>
          <p className="text-[12.5px] text-ink-muted mb-4">
            No email, SMS or WhatsApp sender is wired up yet. Breach notifications are{" "}
            <span className="font-semibold text-ink">logged as evidence only</span> — who was
            notified, through which channel, and when — so the record is complete even before a
            sender exists.
          </p>
          <div className="space-y-3 opacity-60" aria-disabled="true">
            <div>
              <label className="kicker block mb-1.5">SMTP host</label>
              <input className="field" placeholder="smtp.example.in" disabled />
            </div>
            <div>
              <label className="kicker block mb-1.5">Sender API key</label>
              <input className="field" placeholder="coming next — connect a provider" disabled type="password" />
            </div>
          </div>
          <p className="text-[11.5px] text-ink-faint mt-3">
            Coming next: connect SendGrid / SES / a WhatsApp provider here.
          </p>
        </Card>
      </div>

      {/* Capabilities — the honest list */}
      <Card className="mt-5">
        <CardTitle
          right={
            <span className="font-mono text-[11px] text-ink-faint">
              ledger: {health.evidence_ledger.entries} entries · {health.evidence_ledger.chain}
            </span>
          }
        >
          What this build does
        </CardTitle>
        <p className="text-[12.5px] text-ink-muted mb-2">
          Read straight from the live health check — what the MVP claims, and where it stops.
        </p>
        <div className="divide-y divide-dashed divide-hairline">
          {CAPABILITY_LABELS.map(([key, label]) => (
            <div key={key} className="rule-row flex items-start justify-between gap-4 py-2">
              <span className="text-[12.5px] font-semibold text-ink shrink-0">{label}</span>
              <span className="font-mono text-[11.5px] text-ink-muted text-right">{caps[key]}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-5">
        <DangerZone />
      </div>

      <p className="font-mono text-[11px] text-ink-faint mt-8 text-center">
        Pramaan MVP · SQLite + Next.js · no data leaves this machine.
      </p>
    </div>
  );
}
