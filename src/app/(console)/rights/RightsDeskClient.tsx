"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle, Chip, EmptyState, Drawer, CountdownClock } from "@/components/ui";
import { Link2, Check } from "lucide-react";

export interface DsrTask {
  label: string;
  done: boolean;
}

export interface DsrCase {
  id: string;
  type: string;
  requester_name: string;
  requester_email: string;
  note: string;
  status: string;
  assignee: string;
  sla_due_at: string;
  created_at: string;
  resolved_at: string | null;
  resolution_note: string;
  tasks: DsrTask[];
}

const TYPE_TONES: Record<string, "blue" | "teal" | "red" | "amber"> = {
  access: "blue",
  correction: "teal",
  deletion: "red",
  disclosure: "amber",
};

const TYPE_LABELS: Record<string, string> = {
  access: "Access",
  correction: "Correction",
  deletion: "Deletion",
  disclosure: "Disclosure",
};

const STATUS_TONES: Record<string, "amber" | "blue" | "mute" | "green"> = {
  new: "amber",
  in_progress: "blue",
  waiting: "mute",
  resolved: "green",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  in_progress: "In progress",
  waiting: "Waiting",
  resolved: "Resolved",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CopyFormLink({ formPath }: { formPath: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const url = `${window.location.origin}${formPath}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="btn btn-line btn-sm">
      {copied ? <Check className="w-3.5 h-3.5 text-status-green" /> : <Link2 className="w-3.5 h-3.5" />}
      {copied ? "Link copied" : "Copy hosted form link"}
    </button>
  );
}

export function RightsDeskClient({ cases }: { cases: DsrCase[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [assigneeDraft, setAssigneeDraft] = useState("");
  const [showResolve, setShowResolve] = useState(false);
  const [resolutionDraft, setResolutionDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resolveEmailStatus, setResolveEmailStatus] = useState<string | null>(null);

  const selected = cases.find((c) => c.id === selectedId) ?? null;

  const openCase = (c: DsrCase) => {
    setSelectedId(c.id);
    setAssigneeDraft(c.assignee);
    setShowResolve(false);
    setResolutionDraft("");
    setError(null);
    setResolveEmailStatus(null);
  };

  const patchCase = async (id: string, payload: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    setResolveEmailStatus(null);
    try {
      const res = await fetch("/api/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j.error ?? "Update failed");
      }
      router.refresh();
      return j as Record<string, unknown>;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = (taskIdx: number) => {
    if (!selected) return;
    const tasks = selected.tasks.map((t, i) =>
      i === taskIdx ? { ...t, done: !t.done } : t
    );
    patchCase(selected.id, { tasks });
  };

  const saveAssignee = () => {
    if (!selected) return;
    patchCase(selected.id, { assignee: assigneeDraft.trim() });
  };

  const resolveCase = () => {
    if (!selected) return;
    patchCase(selected.id, { status: "resolved", resolution_note: resolutionDraft.trim() }).then((j) => {
      setShowResolve(false);
      const s = j?.email_status;
      if (typeof s === "string" && s) setResolveEmailStatus(s);
    });
  };

  const emailStatusLabel = (s: string) => {
    if (s === "sent") return "Resolution email sent";
    if (s === "logged_not_configured") return "Resolution logged only — no email sender configured";
    if (s === "no_email_on_file") return "No email on file — requester not notified";
    if (s.startsWith("failed")) return `Resolution email failed (${s.slice(8)})`;
    return `Email: ${s}`;
  };

  const doneCount = (c: DsrCase) => c.tasks.filter((t) => t.done).length;

  return (
    <>
      <Card pad={false}>
        {cases.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No requests yet"
              body="When a data principal submits the hosted form, their request lands here as a case with an SLA clock and a task list."
            />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="ledger-head">
                <th className="text-left px-5 py-2 font-semibold">Case</th>
                <th className="text-left px-3 py-2 font-semibold">Type</th>
                <th className="text-left px-3 py-2 font-semibold">Requester</th>
                <th className="text-left px-3 py-2 font-semibold hidden lg:table-cell">Status</th>
                <th className="text-left px-3 py-2 font-semibold">SLA</th>
                <th className="text-left px-5 py-2 font-semibold hidden md:table-cell">Owner</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr
                  key={c.id}
                  className="ledger-row cursor-pointer"
                  onClick={() => openCase(c)}
                >
                  <td className="px-5 py-2.5">
                    <div className="font-mono text-[12px] font-bold text-ink">{c.id}</div>
                    <div className="text-[11px] text-ink-faint font-mono">
                      {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Chip tone={TYPE_TONES[c.type] ?? "mute"}>{TYPE_LABELS[c.type] ?? c.type}</Chip>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-[13px] font-medium text-ink">{c.requester_name}</div>
                    <div className="text-[11.5px] text-ink-muted">{c.requester_email}</div>
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    <Chip tone={STATUS_TONES[c.status] ?? "mute"}>{STATUS_LABELS[c.status] ?? c.status}</Chip>
                  </td>
                  <td className="px-3 py-2.5">
                    {c.status === "resolved" ? (
                      <span className="text-[12px] text-ink-faint font-mono">closed</span>
                    ) : (
                      <CountdownClock
                        deadline={c.sla_due_at}
                        label="to SLA"
                        warnAtMs={24 * 3600 * 1000}
                      />
                    )}
                  </td>
                  <td className="px-5 py-2.5 hidden md:table-cell">
                    <span className="text-[12.5px] text-ink-soft">{c.assignee || <span className="text-ink-faint italic">unassigned</span>}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {selected && (
        <Drawer
          kicker={`Case ${selected.id}`}
          title={`${TYPE_LABELS[selected.type] ?? selected.type} request — ${selected.requester_name}`}
          onClose={() => setSelectedId(null)}
          wide
        >
          <div className="space-y-6">
            {error && (
              <div className="text-[12.5px] text-status-red bg-status-redBg border border-status-red/30 rounded px-3 py-2">
                {error}
              </div>
            )}

            {/* Header facts */}
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={TYPE_TONES[selected.type] ?? "mute"}>{TYPE_LABELS[selected.type] ?? selected.type}</Chip>
              <Chip tone={STATUS_TONES[selected.status] ?? "mute"}>{STATUS_LABELS[selected.status] ?? selected.status}</Chip>
              <span className="text-[11.5px] text-ink-faint font-mono ml-auto">
                Filed {fmtDate(selected.created_at)}
              </span>
            </div>

            {/* Requester */}
            <section>
              <div className="kicker mb-2">Requester</div>
              <div className="text-[13.5px] font-bold text-ink">{selected.requester_name}</div>
              <div className="text-[12.5px] text-ink-muted">{selected.requester_email}</div>
              {selected.note && (
                <div className="mt-2.5 text-[13px] text-ink-soft bg-paper border border-hairline rounded p-3 leading-relaxed">
                  “{selected.note}”
                </div>
              )}
            </section>

            {/* SLA */}
            <section>
              <div className="kicker mb-2">Response deadline</div>
              {selected.status === "resolved" ? (
                <div className="text-[12.5px] text-ink-muted">
                  Resolved {selected.resolved_at ? fmtDate(selected.resolved_at) : "—"}
                  {selected.resolution_note && (
                    <div className="mt-1.5 text-[13px] text-ink-soft bg-paper border border-hairline rounded p-3">
                      {selected.resolution_note}
                    </div>
                  )}
                  {resolveEmailStatus && (
                    <div
                      className={`mt-2 text-[12px] font-medium ${
                        resolveEmailStatus === "sent" ? "text-status-green" : "text-status-amber"
                      }`}
                    >
                      {emailStatusLabel(resolveEmailStatus)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <CountdownClock
                    deadline={selected.sla_due_at}
                    label={`SLA due ${fmtDate(selected.sla_due_at)}`}
                    warnAtMs={24 * 3600 * 1000}
                  />
                </div>
              )}
            </section>

            {/* Tasks */}
            <section>
              <div className="kicker mb-2">
                Task list · {doneCount(selected)}/{selected.tasks.length} done
              </div>
              <div className="border border-hairline rounded-md divide-y divide-hairline">
                {selected.tasks.map((t, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-paper-deep/50"
                  >
                    <input
                      type="checkbox"
                      checked={t.done}
                      disabled={saving || selected.status === "resolved"}
                      onChange={() => toggleTask(i)}
                      className="mt-0.5 w-4 h-4 accent-[#0e5c55]"
                    />
                    <span className={`text-[13px] ${t.done ? "line-through text-ink-faint" : "text-ink-soft"}`}>
                      {t.label}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* Owner */}
            <section>
              <div className="kicker mb-2">Owner</div>
              <div className="flex gap-2">
                <input
                  className="field"
                  placeholder="Assign to a teammate…"
                  value={assigneeDraft}
                  disabled={saving}
                  onChange={(e) => setAssigneeDraft(e.target.value)}
                />
                <button onClick={saveAssignee} disabled={saving} className="btn btn-line btn-sm shrink-0">
                  Save
                </button>
              </div>
            </section>

            {/* Actions */}
            {selected.status !== "resolved" && (
              <section>
                <div className="kicker mb-2">Move case</div>
                {!showResolve ? (
                  <div className="flex flex-wrap gap-2">
                    {selected.status === "new" && (
                      <button
                        onClick={() => patchCase(selected.id, { status: "in_progress" })}
                        disabled={saving}
                        className="btn btn-ink btn-sm"
                      >
                        Start work
                      </button>
                    )}
                    {selected.status === "in_progress" && (
                      <button
                        onClick={() => patchCase(selected.id, { status: "waiting" })}
                        disabled={saving}
                        className="btn btn-line btn-sm"
                      >
                        Mark waiting
                      </button>
                    )}
                    {selected.status === "waiting" && (
                      <button
                        onClick={() => patchCase(selected.id, { status: "in_progress" })}
                        disabled={saving}
                        className="btn btn-line btn-sm"
                      >
                        Resume work
                      </button>
                    )}
                    <button
                      onClick={() => setShowResolve(true)}
                      disabled={saving}
                      className="btn btn-seal btn-sm"
                    >
                      Resolve request…
                    </button>
                  </div>
                ) : (
                  <div className="border border-hairline-strong rounded-md p-3 bg-paper space-y-2.5">
                    <label className="text-[12px] font-semibold text-ink-soft">
                      Resolution note <span className="text-ink-faint font-normal">(what was done for the requester)</span>
                    </label>
                    <textarea
                      className="field"
                      rows={3}
                      placeholder="e.g. Data package emailed to the requester; confirmation received."
                      value={resolutionDraft}
                      onChange={(e) => setResolutionDraft(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={resolveCase} disabled={saving} className="btn btn-seal btn-sm">
                        Confirm resolution
                      </button>
                      <button onClick={() => setShowResolve(false)} disabled={saving} className="btn btn-line btn-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {selected.status === "resolved" && (
              <button
                onClick={() => patchCase(selected.id, { status: "in_progress" })}
                disabled={saving}
                className="btn btn-line btn-sm"
              >
                Reopen case
              </button>
            )}

            <p className="text-[11.5px] text-ink-faint border-t border-hairline pt-3">
              Every change to this case — status, owner, tasks, resolution — is appended to the
              tamper-evident evidence ledger.
            </p>
          </div>
        </Drawer>
      )}
    </>
  );
}

export function StatCards({ counts }: { counts: { label: string; value: number; tone: string }[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {counts.map((s) => (
        <Card key={s.label}>
          <div className={`font-display text-[30px] font-bold leading-none ${s.tone}`}>{s.value}</div>
          <div className="text-[12px] text-ink-muted mt-1.5">{s.label}</div>
        </Card>
      ))}
    </div>
  );
}

void CardTitle;
