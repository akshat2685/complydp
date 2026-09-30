"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Send } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types shared with the server page                                   */
/* ------------------------------------------------------------------ */
export interface BreachVM {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  awareness_at: string;
  board_deadline: string;
  systems: string[];
  categories: string[];
  affected_count: number;
  step: number;
  board_notified_at: string | null;
  users_notified_at: string | null;
}

export interface CommVM {
  id: string;
  channel: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
}

export const STEP_NAMES = ["Open & assess", "Contain & start clocks", "Notify the Board", "Notify affected users"];

/* ------------------------------------------------------------------ */
/*  AdvanceStepButton                                                   */
/* ------------------------------------------------------------------ */
export function AdvanceStepButton({ breach }: { breach: BreachVM }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  if (breach.status === "closed" || breach.step >= 3) return null;
  const next = breach.step + 1;

  async function advance() {
    if (!window.confirm(`Move ${breach.code} to step ${next + 1} — ${STEP_NAMES[next]}?`)) return;
    setSaving(true);
    await fetch("/api/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: breach.id, step: next }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <button className="btn btn-ink btn-sm" onClick={advance} disabled={saving}>
      {saving ? "Advancing…" : `Advance to step ${next + 1}: ${STEP_NAMES[next]}`}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  CloseCaseButton                                                     */
/* ------------------------------------------------------------------ */
export function CloseCaseButton({ breach }: { breach: BreachVM }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  if (breach.status === "closed") return null;

  async function closeCase() {
    if (!window.confirm(`Close ${breach.code}? This ends the active resolution workflow.`)) return;
    setSaving(true);
    await fetch("/api/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: breach.id, status: "closed" }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <button className="btn btn-line btn-sm" onClick={closeCase} disabled={saving}>
      {saving ? "Closing…" : "Close case"}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  NotifyComposer                                                      */
/* ------------------------------------------------------------------ */
const CHANNELS = [
  { value: "board_email", label: "Board email" },
  { value: "user_email", label: "User email" },
  { value: "user_whatsapp", label: "User WhatsApp" },
  { value: "inapp", label: "In-app notice" },
] as const;

function template(
  channel: string,
  b: BreachVM,
  tenant: string,
  dpoEmail: string
): { subject: string; message: string; recipient: string } {
  const aware = new Date(b.awareness_at).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const sys = b.systems.join(", ") || "—";
  const cat = b.categories.join(", ") || "—";
  switch (channel) {
    case "board_email":
      return {
        recipient: "breach-reporting@dataprotectionboard.in",
        subject: `Breach intimation — ${b.code} under the DPDP Act, 2023`,
        message:
`To the Data Protection Board of India,

We intimate a personal data breach that came to our awareness on ${aware}.

Case: ${b.code} — ${b.title}
Systems involved: ${sys}
Categories of personal data: ${cat}
Approximate number of affected Data Principals: ${b.affected_count.toLocaleString("en-IN")}

Containment and assessment are underway. A detailed report will follow within 72 hours of awareness, as required under the Act.

${tenant}
Data Protection Officer — ${dpoEmail}`,
      };
    case "user_email":
      return {
        recipient: "",
        subject: `Important notice about your personal data — ${b.code}`,
        message:
`Dear customer,

We are writing to tell you about an incident that may involve your personal data.

What happened: ${b.title}
When we became aware: ${aware}
Data involved: ${cat}

What we are doing: we have contained the exposure, revoked the unauthorised access, and informed the Data Protection Board of India.

What you can do: stay alert for unusual messages asking for personal details. We will never ask for passwords or OTPs over email.

Questions? Write to our Data Protection Officer at ${dpoEmail}, quoting case ${b.code}.

— Team ${tenant}`,
      };
    case "user_whatsapp":
      return {
        recipient: "",
        subject: "",
        message: `${tenant}: We found an incident that may involve your data (${b.code}): ${b.title}. Affected data: ${cat}. We are containing it and have informed the Data Protection Board. Questions: ${dpoEmail}.`,
      };
    default:
      return {
        recipient: "All app users",
        subject: `Security notice — ${b.code}`,
        message: `Security notice (${b.code}): ${b.title}. We became aware on ${aware}. Data involved: ${cat}. We are containing the exposure and have informed the Data Protection Board of India. Questions: ${dpoEmail}.`,
      };
  }
}

export function NotifyComposer({
  breach,
  tenant,
  dpoEmail,
}: {
  breach: BreachVM;
  tenant: string;
  dpoEmail: string;
}) {
  const router = useRouter();
  const initial = template("board_email", breach, tenant, dpoEmail);
  const [channel, setChannel] = useState<string>("board_email");
  const [recipient, setRecipient] = useState(initial.recipient);
  const [subject, setSubject] = useState(initial.subject);
  const [message, setMessage] = useState(initial.message);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  function applyChannel(c: string) {
    setChannel(c);
    const t = template(c, breach, tenant, dpoEmail);
    setRecipient(t.recipient);
    setSubject(t.subject);
    setMessage(t.message);
    setError("");
  }

  async function send() {
    if (!recipient.trim() || !message.trim()) {
      setError("Recipient and message are required.");
      return;
    }
    setSending(true);
    setError("");
    const res = await fetch(`/api/incidents/${breach.id}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, recipient: recipient.trim(), subject: subject.trim(), message: message.trim() }),
    });
    setSending(false);
    if (!res.ok) {
      setError("Could not log the notification. Please try again.");
      return;
    }
    applyChannel(channel);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="kicker block mb-1.5">Channel</label>
          <select className="field" value={channel} onChange={(e) => applyChannel(e.target.value)}>
            {CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="kicker block mb-1.5">Recipient</label>
          <input
            className="field font-mono"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={channel === "board_email" ? "breach-reporting@dataprotectionboard.in" : "Who receives this?"}
          />
        </div>
      </div>
      {(channel === "board_email" || channel === "user_email") && (
        <div>
          <label className="kicker block mb-1.5">Subject</label>
          <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
      )}
      <div>
        <label className="kicker block mb-1.5">Message</label>
        <textarea
          className="field font-mono"
          rows={channel === "user_whatsapp" || channel === "inapp" ? 4 : 10}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      {error && <p className="text-[12.5px] text-status-red font-semibold">{error}</p>}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11.5px] text-ink-muted max-w-md">
          MVP logs notifications as tamper-evident evidence. Connect a real sender in Settings to actually deliver.
        </p>
        <button className="btn btn-teal btn-sm" onClick={send} disabled={sending}>
          <Send className="w-3.5 h-3.5" /> {sending ? "Logging…" : "Log notification"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BoardPackDownload — 72h report draft as markdown                    */
/* ------------------------------------------------------------------ */
export function BoardPackDownload({ breach, comms }: { breach: BreachVM; comms: CommVM[] }) {
  function download() {
    const aware = new Date(breach.awareness_at).toLocaleString("en-IN");
    const lines = [
      `# Breach intimation pack — ${breach.code}`,
      ``,
      `> Draft prepared from the Pramaan evidence registry. Verify facts before filing with the Data Protection Board of India.`,
      ``,
      `## Case`,
      ``,
      `- **Code:** ${breach.code}`,
      `- **Title:** ${breach.title}`,
      `- **Severity:** ${breach.severity}`,
      `- **Status:** ${breach.status}`,
      `- **Moment of awareness:** ${aware}`,
      `- **72-hour Board deadline:** ${new Date(breach.board_deadline).toLocaleString("en-IN")}`,
      ``,
      `## What happened`,
      ``,
      breach.description || "_No description recorded._",
      ``,
      `## Scope`,
      ``,
      `- **Systems involved:** ${breach.systems.join(", ") || "—"}`,
      `- **Categories of personal data:** ${breach.categories.join(", ") || "—"}`,
      `- **Affected Data Principals (approx):** ${breach.affected_count.toLocaleString("en-IN")}`,
      ``,
      `## Notifications logged`,
      ``,
    ];
    if (comms.length === 0) {
      lines.push("_No notifications logged yet._", ``);
    } else {
      for (const c of comms) {
        lines.push(`### ${c.channel} → ${c.recipient} (${new Date(c.created_at).toLocaleString("en-IN")})`);
        if (c.subject) lines.push(`**Subject:** ${c.subject}`);
        lines.push(``, c.body, ``);
      }
    }
    lines.push(`## Containment notes`, ``, breach.description || "_—_", ``);
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${breach.code}-board-pack.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button className="btn btn-line btn-sm" onClick={download}>
      <Download className="w-3.5 h-3.5" /> Download .md
    </button>
  );
}
