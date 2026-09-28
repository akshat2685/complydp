import { qOne, parseJson, getTenantId } from "@/server/db";
import { GET as healthCheck } from "@/app/api/health/route";
import { PageHead, Card, CardTitle } from "@/components/ui";
import { NotificationSettings, NotificationChip } from "./NotificationSettings";
import { GitHubSettings } from "./GitHubSettings";
import { maskToken, readGithubToken } from "@/server/github";

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
  const tid = await getTenantId();
  // Layout redirects to /setup when no tenant exists; this is a safety net.
  if (!tid) return <div className="p-8 text-ink-muted">Workspace is not set up yet.</div>;
  const tenant = await qOne(`SELECT * FROM tenant WHERE id = ?`, tid) as {
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

  const ghToken = await readGithubToken();
  const ghInitial = { configured: !!ghToken, masked: ghToken ? maskToken(ghToken) : null };

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
              <NotificationChip />
            }
          >
            Notifications
          </CardTitle>
          <NotificationSettings />
          <p className="text-[11.5px] text-ink-faint mt-3">
            Real now: Resend for email and a WhatsApp webhook. When a breach notification is
            triggered, it is genuinely sent through the configured provider and the provider's
            message id is stored as evidence. With no provider configured, notifications stay
            logged as evidence only.
          </p>
        </Card>
      </div>

      {/* GitHub connection */}
      <div className="mt-5">
        <GitHubSettings initial={ghInitial} />
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

      <p className="font-mono text-[11px] text-ink-faint mt-8 text-center">
        Pramaan · evidence-first privacy ops.
      </p>
    </div>
  );
}
