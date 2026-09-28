"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui";
import { CheckCircle2 } from "lucide-react";
import { QUESTIONNAIRE_QUESTIONS } from "@/lib/questionnaire";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function QuestionnaireFormClient({ token, vendorName }: { token: string; vendorName: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; submitted_at: string } | null>(null);

  const set = (id: string, v: string) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    setErrors((e) => {
      if (!e[id]) return e;
      const next = { ...e };
      delete next[id];
      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    for (const q of QUESTIONNAIRE_QUESTIONS) {
      if (q.required && !(answers[q.id] ?? "").trim()) e[q.id] = "This question is required.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitError(null);
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/q/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Something went wrong. Please try again.");
      setDone({ id: j.id, submitted_at: j.submitted_at });
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
        <h2 className="font-display text-[22px] font-bold text-ink">Assessment submitted</h2>
        <p className="text-[13.5px] text-ink-muted mt-2 max-w-sm mx-auto leading-relaxed">
          Thank you. {vendorName}'s answers have been recorded as evidence on{" "}
          <strong className="text-ink">{fmtDate(done.submitted_at)}</strong>.
        </p>
        <div className="mt-5 inline-block bg-paper border border-hairline-strong rounded-md px-5 py-3">
          <div className="kicker mb-1">Your reference ID</div>
          <div className="font-mono text-[18px] font-bold text-ink tracking-wide">{done.id}</div>
        </div>
        <p className="text-[12px] text-ink-faint mt-4 max-w-sm mx-auto">
          Keep this reference ID — quote it in any follow-up email so the assessment can be found instantly.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={submit} noValidate>
        <div className="space-y-5">
          {QUESTIONNAIRE_QUESTIONS.map((q, i) => (
            <div key={q.id}>
              <label htmlFor={`q-${q.id}`} className="kicker mb-1.5 block normal-case text-[12px] font-bold text-ink">
                <span className="font-mono text-ink-faint mr-1.5">{String(i + 1).padStart(2, "0")}</span>
                {q.label}
                {q.required && <span className="text-status-red ml-1">*</span>}
              </label>
              {q.type === "yes-no" ? (
                <div className="flex gap-2" role="radiogroup" aria-label={q.label}>
                  {(["yes", "no"] as const).map((v) => {
                    const active = (answers[q.id] ?? "").toLowerCase() === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => set(q.id, v)}
                        className={`flex-1 border rounded-md py-2.5 text-[13px] font-bold capitalize transition-colors ${
                          active
                            ? "border-seal bg-seal-bg/40 text-seal shadow-card"
                            : "border-hairline bg-paper-panel text-ink-muted hover:border-hairline-strong"
                        }`}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              ) : q.type === "textarea" ? (
                <textarea
                  id={`q-${q.id}`}
                  className="field min-h-[84px]"
                  placeholder={q.hint}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => set(q.id, e.target.value)}
                />
              ) : (
                <input
                  id={`q-${q.id}`}
                  className="field"
                  placeholder={q.hint}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => set(q.id, e.target.value)}
                />
              )}
              {q.hint && q.type === "yes-no" && (
                <p className="text-[11.5px] text-ink-faint mt-1">{q.hint}</p>
              )}
              {errors[q.id] && <p className="text-[12px] text-status-red mt-1">{errors[q.id]}</p>}
            </div>
          ))}
        </div>

        {submitError && (
          <div className="mt-5 text-[12.5px] text-status-red bg-status-redBg border border-status-red/30 rounded px-3 py-2">
            {submitError}
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn btn-seal w-full mt-6 !py-2.5">
          {submitting ? "Submitting…" : "Submit assessment"}
        </button>

        <p className="text-[11.5px] text-ink-faint text-center mt-3 leading-relaxed">
          Your answers are written to {vendorName}'s evidence file and cannot be edited after
          submission — if something changes, ask for a fresh assessment link.
        </p>
      </form>
    </Card>
  );
}
