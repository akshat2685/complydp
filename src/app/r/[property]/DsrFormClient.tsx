"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui";
import { Eye, PencilLine, Trash2, Share2, CheckCircle2 } from "lucide-react";

const REQUEST_TYPES = [
  {
    value: "access",
    title: "See my data",
    body: "Get a summary of the personal data we hold about you.",
    icon: Eye,
  },
  {
    value: "correction",
    title: "Fix my data",
    body: "Correct or complete personal details we have wrong.",
    icon: PencilLine,
  },
  {
    value: "deletion",
    title: "Delete my data",
    body: "Ask us to erase your personal data.",
    icon: Trash2,
  },
  {
    value: "disclosure",
    title: "Know who we shared with",
    body: "Learn which third parties received your data.",
    icon: Share2,
  },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DsrFormClient({ propertyId }: { propertyId: string }) {
  const [type, setType] = useState("access");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; sla_due_at: string } | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Please tell us your name.";
    if (!email.trim()) e.email = "Please enter your email address.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      e.email = "That doesn't look like a valid email address.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          requester_name: name.trim(),
          requester_email: email.trim().toLowerCase(),
          note: note.trim(),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Something went wrong. Please try again.");
      setDone({ id: j.id, sla_due_at: j.sla_due_at });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Card className="text-center py-10">
        <CheckCircle2 className="w-12 h-12 text-status-green mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="font-display text-[22px] font-bold text-ink">Request received</h2>
        <p className="text-[13.5px] text-ink-muted mt-2 max-w-sm mx-auto leading-relaxed">
          Thank you. Your request has been logged and our privacy team will respond by{" "}
          <strong className="text-ink">{fmtDate(done.sla_due_at)}</strong>.
        </p>
        <div className="mt-5 inline-block bg-paper border border-hairline-strong rounded-md px-5 py-3">
          <div className="kicker mb-1">Your reference ID</div>
          <div className="font-mono text-[18px] font-bold text-ink tracking-wide">{done.id}</div>
        </div>
        <p className="text-[12px] text-ink-faint mt-4 max-w-sm mx-auto">
          Keep this reference ID — quote it in any follow-up email so we can find your case instantly.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={submit} noValidate>
        <div className="kicker mb-2.5">What would you like to do?</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5" role="radiogroup" aria-label="Request type">
          {REQUEST_TYPES.map((t) => {
            const Icon = t.icon;
            const active = type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setType(t.value)}
                className={`text-left border rounded-md p-3.5 transition-colors ${
                  active
                    ? "border-seal bg-seal-bg/40 shadow-card"
                    : "border-hairline bg-paper-panel hover:border-hairline-strong"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${active ? "text-seal" : "text-ink-muted"}`} strokeWidth={2} />
                  <span className="text-[13.5px] font-bold text-ink">{t.title}</span>
                </div>
                <p className="text-[12px] text-ink-muted leading-snug">{t.body}</p>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="dsr-name" className="kicker mb-1.5 block">
              Your full name
            </label>
            <input
              id="dsr-name"
              className="field"
              placeholder="e.g. Ananya Iyer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            {errors.name && <p className="text-[12px] text-status-red mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="dsr-email" className="kicker mb-1.5 block">
              Email address
            </label>
            <input
              id="dsr-email"
              type="email"
              className="field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {errors.email && <p className="text-[12px] text-status-red mt-1">{errors.email}</p>}
            <p className="text-[11.5px] text-ink-faint mt-1">
              We'll use this to verify your identity and send our response.
            </p>
          </div>

          <div>
            <label htmlFor="dsr-note" className="kicker mb-1.5 block">
              What should we know? <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              id="dsr-note"
              className="field"
              rows={4}
              placeholder="Anything that helps us find your data — an order number, the phone number on your account, dates…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {submitError && (
          <div className="mt-4 text-[12.5px] text-status-red bg-status-redBg border border-status-red/30 rounded px-3 py-2">
            {submitError}
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn btn-seal w-full mt-5 !py-2.5">
          {submitting ? "Submitting…" : "Submit request"}
        </button>

        <p className="text-[11.5px] text-ink-faint text-center mt-3 leading-relaxed">
          Under India's Digital Personal Data Protection Act, 2023, you have the right to access,
          correct, erase your data and know who it was shared with.
        </p>
      </form>
    </Card>
  );
}
