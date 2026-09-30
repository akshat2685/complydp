import { q, parseJson, getDefaultPropertyId } from "@/server/db";
import { PageHead } from "@/components/ui";
import { RightsDeskClient, CopyFormLink, StatCards, type DsrCase, type DsrTask } from "./RightsDeskClient";

export default async function RightsPage() {

  const propId = await getDefaultPropertyId();
  const rows = await q(`SELECT * FROM dsr_cases ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'waiting' THEN 2 ELSE 3 END, sla_due_at ASC`) as Array<Record<string, unknown>>;

  const cases: DsrCase[] = rows.map((r) => ({
    id: r.id as string,
    type: r.type as string,
    requester_name: r.requester_name as string,
    requester_email: r.requester_email as string,
    note: (r.note as string) ?? "",
    status: r.status as string,
    assignee: (r.assignee as string) ?? "",
    sla_due_at: r.sla_due_at as string,
    created_at: r.created_at as string,
    resolved_at: (r.resolved_at as string) ?? null,
    resolution_note: (r.resolution_note as string) ?? "",
    tasks: parseJson<DsrTask[]>(r.tasks_json as string, []),
  }));

  const count = (s: string) => cases.filter((c) => c.status === s).length;
  const stats = [
    { label: "New", value: count("new"), tone: count("new") > 0 ? "text-status-amber" : "text-ink" },
    { label: "In progress", value: count("in_progress"), tone: "text-ink" },
    { label: "Waiting", value: count("waiting"), tone: "text-ink" },
    { label: "Resolved", value: count("resolved"), tone: "text-status-green" },
  ];

  return (
    <div>
      <PageHead
        kicker="RIGHTS & CONSENT · RIGHTS DESK"
        title="Data principal requests"
        lede="DPDP §§11–13: every request gets a case, an owner, an SLA clock and a task list."
        meta={<CopyFormLink formPath={propId ? `/r/${propId}` : "/r"} />}
      />

      <StatCards counts={stats} />

      <p className="text-[12px] text-ink-muted mb-4 -mt-2">
        The <span className="font-mono">Copy hosted form link</span> button copies the public form URL —
        this is the link your website's privacy page points visitors to.
      </p>

      <RightsDeskClient cases={cases} />
    </div>
  );
}
