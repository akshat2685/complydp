import { notFound } from "next/navigation";
import { q, qOne, run, parseJson } from "@/server/db";
import {
  PageHead,
  Card,
  CardTitle,
  Chip,
  EmptyState,
  BackLink,
  Stepper,
  ElapsedClock,
  CountdownClock,
  ProofSeal,
} from "@/components/ui";
import {
  BreachVM,
  CommVM,
  AdvanceStepButton,
  CloseCaseButton,
  NotifyComposer,
  BoardPackDownload,
} from "./BreachWorkspace";

interface BreachRow {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  awareness_at: string;
  systems_json: string;
  categories_json: string;
  affected_count: number;
  step: number;
  board_notified_at: string | null;
  users_notified_at: string | null;
}

interface CommRow {
  id: string;
  channel: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
}

const STEP_NAMES = ["Open & assess", "Contain & start clocks", "Notify the Board", "Notify affected users"];

const STEP_HINTS = [
  "Record what happened, scope and severity.",
  "Stop the bleed. Statutory clocks run from awareness.",
  "Intimate the Data Protection Board within 72 hours.",
  "Tell affected principals without delay.",
];

function sevTone(s: string): "red" | "amber" | "blue" | "mute" {
  return s === "critical" || s === "high" ? "red" : s === "medium" ? "amber" : "mute";
}

function channelTone(c: string): "blue" | "teal" | "amber" | "seal" | "mute" {
  return c === "board_email" ? "seal" : c === "user_email" ? "blue" : c === "user_whatsapp" ? "teal" : c === "inapp" ? "amber" : "mute";
}

export default async function BreachDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // node:sqlite returns [Object: null prototype] rows — Next.js refuses to
  // serialize those into Client Components, so round-trip through JSON first.
  const rawRow = await qOne("SELECT * FROM breach_cases WHERE id = ?", id);
  if (!rawRow) notFound();
  const row = JSON.parse(JSON.stringify(rawRow)) as BreachRow;

  const tenant = JSON.parse(
    JSON.stringify(await qOne("SELECT name, dpo_email FROM tenant WHERE id = 'tenant_meridian'"))
  ) as {
    name: string;
    dpo_email: string;
  };

  const comms = JSON.parse(
    JSON.stringify(await q(`SELECT * FROM breach_comms WHERE breach_id = ? ORDER BY created_at DESC`, id))
  ) as CommRow[];

  const systems = parseJson<string[]>(row.systems_json, []);
  const categories = parseJson<string[]>(row.categories_json, []);
  const boardDeadline = new Date(new Date(row.awareness_at).getTime() + 72 * 3600_000).toISOString();
  const closed = row.status === "closed";

  const breach: BreachVM = {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    status: row.status,
    severity: row.severity,
    awareness_at: row.awareness_at,
    board_deadline: boardDeadline,
    systems,
    categories,
    affected_count: row.affected_count,
    step: row.step,
    board_notified_at: row.board_notified_at,
    users_notified_at: row.users_notified_at,
  };
  const commVMs: CommVM[] = comms.map((c) => ({
    id: c.id,
    channel: c.channel,
    recipient: c.recipient,
    subject: c.subject,
    body: c.body,
    status: c.status,
    created_at: c.created_at,
  }));

  return (
    <div>
      <BackLink href="/breach">Breach register</BackLink>
      <PageHead
        kicker={`Breach file · ${row.code}`}
        title={row.title}
        lede={row.description}
        meta={
          <div className="flex items-center gap-2">
            <Chip tone={sevTone(row.severity)}>{row.severity}</Chip>
            {closed ? <Chip tone="mute">Closed</Chip> : <Chip tone="red">Open</Chip>}
          </div>
        }
      />

      {/* Workflow stepper */}
      <div className="mb-6">
        <Stepper
          steps={STEP_NAMES.map((title, i) => ({ title, hint: STEP_HINTS[i] }))}
          current={closed ? 4 : row.step}
          done={closed ? 4 : row.step}
        />
        {!closed && (
          <div className="flex items-center gap-2 mt-3">
            <AdvanceStepButton breach={breach} />
            <CloseCaseButton breach={breach} />
          </div>
        )}
      </div>

      {/* Live clocks */}
      <Card className="mb-6 border-status-red/40 bg-status-redBg/25">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
          <ElapsedClock from={row.awareness_at} label="since awareness — “without delay” is running" />
          {!closed && (
            <CountdownClock deadline={boardDeadline} label="to the 72-hour Board deadline" warnAtMs={24 * 3600_000} />
          )}
          <div>
            <div className="font-mono text-[19px] font-bold text-ink tnum">
              {row.affected_count.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-ink-muted">principals affected (approx)</div>
          </div>
          {row.step >= 1 && !closed && (
            <Chip tone="teal">Clocks started</Chip>
          )}
          <div className="ml-auto flex flex-col gap-1.5 text-[12px]">
            <span className={row.board_notified_at ? "text-status-green font-semibold" : "text-ink-muted"}>
              Board: {row.board_notified_at ? `notified ${new Date(row.board_notified_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "not yet notified"}
            </span>
            <span className={row.users_notified_at ? "text-status-green font-semibold" : "text-ink-muted"}>
              Users: {row.users_notified_at ? `notified ${new Date(row.users_notified_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "not yet notified"}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Notify composer */}
        <Card>
          <CardTitle>Notify</CardTitle>
          <NotifyComposer breach={breach} tenant={tenant.name} dpoEmail={tenant.dpo_email} />
        </Card>

        {/* Board intimation pack */}
        <Card>
          <CardTitle right={<BoardPackDownload breach={breach} comms={commVMs} />}>
            Board intimation pack
          </CardTitle>
          <div className="text-[13px] text-ink-soft space-y-2 leading-relaxed">
            <p>
              <strong className="text-ink">Case {row.code}</strong> — awareness{" "}
              {new Date(row.awareness_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })},
              deadline {new Date(boardDeadline).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.
            </p>
            <div className="rule-row py-1.5 flex justify-between gap-3">
              <span className="text-ink-muted">Systems</span>
              <span className="font-mono text-[12px] text-right">{systems.join(", ") || "—"}</span>
            </div>
            <div className="rule-row py-1.5 flex justify-between gap-3">
              <span className="text-ink-muted">Data categories</span>
              <span className="font-mono text-[12px] text-right">{categories.join(", ") || "—"}</span>
            </div>
            <div className="rule-row py-1.5 flex justify-between gap-3">
              <span className="text-ink-muted">Affected principals</span>
              <span className="font-mono text-[12px]">{row.affected_count.toLocaleString("en-IN")}</span>
            </div>
            <div className="rule-row py-1.5 flex justify-between gap-3">
              <span className="text-ink-muted">Notifications logged</span>
              <span className="font-mono text-[12px]">{comms.length}</span>
            </div>
            <p className="text-[12px] text-ink-muted pt-1">
              Draft only — verify every fact against the evidence ledger before filing with the Board.
            </p>
          </div>
        </Card>
      </div>

      {/* Comms log */}
      <Card pad={false} className="mt-5">
        <div className="p-5 pb-3">
          <CardTitle right={<span className="kicker">{comms.length} logged</span>}>
            Notification log
          </CardTitle>
        </div>
        {comms.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              title="Nothing notified yet"
              body="Use the composer to log Board and user notifications. Each entry becomes tamper-evident evidence."
            />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="ledger-head">
                <th className="text-left px-5 py-2.5">Time</th>
                <th className="text-left px-3 py-2.5">Channel</th>
                <th className="text-left px-3 py-2.5">Recipient</th>
                <th className="text-left px-3 py-2.5 hidden md:table-cell">Reference</th>
                <th className="text-right px-5 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {comms.map((c) => (
                <tr key={c.id} className="ledger-row">
                  <td className="px-5 py-2.5 font-mono text-[12px] text-ink-soft whitespace-nowrap">
                    {new Date(c.created_at).toLocaleString("en-IN", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2.5">
                    <Chip tone={channelTone(c.channel)}>{c.channel.replace("_", " ")}</Chip>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] text-ink font-mono">{c.recipient}</td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    <ProofSeal hash={c.id} label="log" />
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <Chip tone="teal">{c.status}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
