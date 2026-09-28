import Link from "next/link";
import { db } from "@/server/db";
import { PageHead, Card, Chip, EmptyState, CountdownClock } from "@/components/ui";
import { OpenBreachCase } from "./OpenBreachCase";
import { ArrowUpRight, Check, Minus } from "lucide-react";

interface BreachRow {
  id: string;
  code: string;
  title: string;
  status: string;
  severity: string;
  awareness_at: string;
  systems_json: string;
  categories_json: string;
  affected_count: number;
  step: number;
  board_notified_at: string | null;
  users_notified_at: string | null;
  created_at: string;
}

function sevTone(s: string): "red" | "amber" | "blue" | "mute" {
  return s === "critical" ? "red" : s === "high" ? "red" : s === "medium" ? "amber" : "mute";
}

const STEP_NAMES = ["Open & assess", "Contain & start clocks", "Notify the Board", "Notify affected users"];

export default function BreachRegisterPage() {
  const d = db();
  const rows = d.prepare(
    `SELECT * FROM breach_cases ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, awareness_at DESC`
  ).all() as unknown as BreachRow[];

  const openCount = rows.filter((r) => r.status === "open").length;

  return (
    <div>
      <PageHead
        kicker="Rights & Consent · Breach Resolution"
        title="Breach register"
        lede="DPDP Act §8(6): notify the Data Protection Board and affected principals without delay; a detailed Board report follows within 72 hours of awareness."
        meta={<OpenBreachCase />}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No breach cases on record"
          body="When a personal data breach comes to light, open a case here. The 72-hour Board clock and the without-delay user clock start from the moment of awareness."
          action={<OpenBreachCase />}
        />
      ) : (
        <Card pad={false}>
          <table className="w-full">
            <thead>
              <tr className="ledger-head">
                <th className="text-left px-5 py-2.5">Case</th>
                <th className="text-left px-3 py-2.5 hidden lg:table-cell">Step</th>
                <th className="text-left px-3 py-2.5 hidden md:table-cell">Board clock</th>
                <th className="text-right px-3 py-2.5 hidden sm:table-cell">Affected</th>
                <th className="text-center px-3 py-2.5 hidden md:table-cell">Notified</th>
                <th className="text-right px-5 py-2.5">Severity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const deadline = new Date(new Date(r.awareness_at).getTime() + 72 * 3600_000).toISOString();
                const closed = r.status === "closed";
                return (
                  <tr key={r.id} className="ledger-row">
                    <td className="px-5 py-3">
                      <Link href={`/breach/${r.id}`} className="group">
                        <div className="font-mono text-[11px] text-ink-faint">{r.code}</div>
                        <div className="text-[13.5px] font-semibold text-ink group-hover:underline leading-snug flex items-center gap-1">
                          {r.title}
                          <ArrowUpRight className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                        </div>
                      </Link>
                      {closed && (
                        <div className="mt-1">
                          <Chip tone="mute">Closed</Chip>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <Chip tone={closed ? "mute" : r.step >= 2 ? "teal" : "blue"}>
                        Step {r.step + 1} of 4 · {STEP_NAMES[r.step] ?? ""}
                      </Chip>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      {closed ? (
                        <span className="text-[12px] text-ink-faint">—</span>
                      ) : (
                        <CountdownClock deadline={deadline} label="" warnAtMs={24 * 3600_000} />
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[13px] text-ink hidden sm:table-cell tnum">
                      {r.affected_count.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <div className="flex items-center justify-center gap-3 text-[11px] font-mono">
                        <span
                          className={`inline-flex items-center gap-1 ${r.board_notified_at ? "text-status-green" : "text-ink-faint"}`}
                          title={r.board_notified_at ? `Board notified ${r.board_notified_at}` : "Board not yet notified"}
                        >
                          {r.board_notified_at ? <Check className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                          Board
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 ${r.users_notified_at ? "text-status-green" : "text-ink-faint"}`}
                          title={r.users_notified_at ? `Users notified ${r.users_notified_at}` : "Users not yet notified"}
                        >
                          {r.users_notified_at ? <Check className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                          Users
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Chip tone={sevTone(r.severity)}>{r.severity}</Chip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <p className="text-[12px] text-ink-muted mt-4">
        {openCount} open case{openCount === 1 ? "" : "s"} · Clocks are computed live from each case's recorded moment of awareness.
      </p>
    </div>
  );
}
