import Link from "next/link";
import { db, parseJson } from "@/server/db";
import { PageHead, Card, CardTitle, Chip, EmptyState, ElapsedClock, CountdownClock } from "@/components/ui";
import { ArrowUpRight } from "lucide-react";

function sevTone(s: string): "red" | "amber" | "blue" | "mute" {
  return s === "high" || s === "critical" ? "red" : s === "medium" ? "amber" : s === "low" ? "blue" : "mute";
}

export default function OverviewPage() {
  const d = db();
  const q = (sql: string, ...p: unknown[]) => (d.prepare(sql).get(...(p as [])) as { n: number }).n;

  const openFindings = q("SELECT COUNT(*) AS n FROM findings WHERE status = 'needs_review'");
  const consent7d = q("SELECT COUNT(*) AS n FROM consent_events WHERE created_at > datetime('now','-7 days')");
  const dsrOpen = q("SELECT COUNT(*) AS n FROM dsr_cases WHERE status IN ('new','in_progress','waiting')");
  const breachOpen = q("SELECT COUNT(*) AS n FROM breach_cases WHERE status = 'open'");

  const findings = d.prepare(
    `SELECT id, category, title, severity, created_at FROM findings WHERE status = 'needs_review' ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC LIMIT 8`
  ).all() as Array<{ id: string; category: string; title: string; severity: string; created_at: string }>;

  const activity = d.prepare(
    `SELECT seq, ts, actor, action, summary FROM evidence_ledger ORDER BY seq DESC LIMIT 8`
  ).all() as Array<{ seq: number; ts: string; actor: string; action: string; summary: string }>;

  const breach = d.prepare(`SELECT * FROM breach_cases WHERE status = 'open' ORDER BY awareness_at DESC LIMIT 1`).get() as
    | { id: string; code: string; title: string; awareness_at: string; affected_count: number; board_notified_at: string | null; users_notified_at: string | null }
    | undefined;

  const state = [
    ["Cookies inventoried", q("SELECT COUNT(*) AS n FROM cookies"), "/consent"],
    ["Vendors on register", q("SELECT COUNT(*) AS n FROM vendors"), "/vendors"],
    ["Systems mapped", q("SELECT COUNT(*) AS n FROM systems"), "/data-map"],
    ["Data fields classified", q("SELECT COUNT(*) AS n FROM data_fields"), "/data-map"],
    ["Processing activities", q("SELECT COUNT(*) AS n FROM processing_activities"), "/data-map"],
    ["Ledger entries", q("SELECT COUNT(*) AS n FROM evidence_ledger"), "/evidence"],
  ] as Array<[string, number, string]>;

  const stats = [
    { label: "Findings needing review", value: openFindings, href: "/", tone: openFindings > 0 ? "text-seal" : "text-ink" },
    { label: "Consent events · last 7 days", value: consent7d, href: "/consent", tone: "text-ink" },
    { label: "Open rights requests", value: dsrOpen, href: "/rights", tone: dsrOpen > 0 ? "text-status-amber" : "text-ink" },
    { label: "Open breach cases", value: breachOpen, href: "/breach", tone: breachOpen > 0 ? "text-status-red" : "text-ink" },
  ];

  return (
    <div>
      <PageHead
        kicker="Registry · Overview"
        title="Where things stand"
        lede="Every number below is read live from the registry database. Nothing here is a mock."
        meta={
          <Link href="/evidence" className="btn btn-line btn-sm">
            Verify evidence chain <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        }
      />

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:border-hairline-strong transition-colors">
              <div className={`font-display text-[30px] font-bold leading-none ${s.tone}`}>{s.value}</div>
              <div className="text-[12px] text-ink-muted mt-1.5">{s.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Breach clock banner */}
      {breach && (
        <Card className="mb-6 border-status-red/40 bg-status-redBg/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="kicker mb-1" style={{ color: "#b91c1c" }}>
                Live statutory clock
              </div>
              <div className="font-display text-[17px] font-bold text-ink">
                {breach.code}: {breach.title}
              </div>
              <div className="text-[12px] text-ink-muted mt-0.5">
                {breach.affected_count.toLocaleString("en-IN")} principals affected ·
                Board {breach.board_notified_at ? "notified" : "not yet notified"} ·
                Users {breach.users_notified_at ? "notified" : "not yet notified"}
              </div>
            </div>
            <div className="flex gap-6">
              <ElapsedClock from={breach.awareness_at} label="since awareness" />
              <CountdownClock
                deadline={new Date(new Date(breach.awareness_at).getTime() + 72 * 3600_000).toISOString()}
                label="to DP Board 72h deadline"
              />
            </div>
            <Link href={`/breach/${breach.id}`} className="btn btn-seal btn-sm">
              Open breach file <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Attention queue */}
        <Card pad={false} className="lg:col-span-3">
          <div className="p-5 pb-3">
            <CardTitle right={<span className="kicker">{openFindings} open</span>}>
              Attention queue
            </CardTitle>
          </div>
          {findings.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState title="All clear" body="No findings need review right now. New cookie scans, DSRs and breaches will appear here." />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="ledger-head">
                  <th className="text-left px-5 py-2 font-semibold">Finding</th>
                  <th className="text-left px-3 py-2 font-semibold hidden md:table-cell">Raised</th>
                  <th className="text-right px-5 py-2 font-semibold">Severity</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f) => (
                  <tr key={f.id} className="ledger-row">
                    <td className="px-5 py-2.5">
                      <div className="text-[13px] font-medium text-ink leading-snug">{f.title}</div>
                      <div className="font-mono text-[10.5px] text-ink-faint mt-0.5 uppercase">{f.category}</div>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-ink-muted font-mono hidden md:table-cell whitespace-nowrap">
                      {new Date(f.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <Chip tone={sevTone(f.severity)}>{f.severity}</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div className="lg:col-span-2 space-y-5">
          {/* System state */}
          <Card>
            <CardTitle>System state</CardTitle>
            <div className="divide-y divide-dashed divide-hairline">
              {state.map(([label, n, href]) => (
                <Link key={label} href={href} className="rule-row flex items-center justify-between py-2 group">
                  <span className="text-[12.5px] text-ink-soft group-hover:text-ink">{label}</span>
                  <span className="font-mono text-[13px] font-bold text-ink">{n}</span>
                </Link>
              ))}
            </div>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardTitle right={<Link href="/evidence" className="text-[11.5px] font-semibold text-teal hover:underline">Full ledger →</Link>}>
              Recent registry activity
            </CardTitle>
            <div className="space-y-3">
              {activity.map((a) => (
                <div key={a.seq} className="flex gap-3">
                  <span className="font-mono text-[10.5px] text-ink-faint pt-0.5 shrink-0">#{a.seq}</span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] text-ink leading-snug">{a.summary}</div>
                    <div className="font-mono text-[10.5px] text-ink-faint mt-0.5">
                      {new Date(a.ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {a.actor}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

void parseJson;
