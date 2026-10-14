"use client";

import { useEffect, useState } from "react";
import { Seal } from "@/components/ui";

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">
        {props.label}
      </label>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="field"
      />
      {props.hint && (
        <div className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">{props.hint}</div>
      )}
    </div>
  );
}

export default function SetupPage() {
  const [company, setCompany] = useState("");
  const [domain, setDomain] = useState("");
  const [dpoName, setDpoName] = useState("");
  const [dpoEmail, setDpoEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((j) => {
        if (j.setup_complete) window.location.href = "/";
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          company_name: company,
          domain,
          dpo_name: dpoName,
          dpo_email: dpoEmail,
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "Setup failed");
      window.location.href = "/";
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="flex items-center gap-3 text-ink-muted">
          <Seal size={28} />
          <span className="font-mono text-[12px] uppercase tracking-[0.14em]">
            Checking workspace…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-10">
      <div className="w-full max-w-[460px]">
        <form
          onSubmit={submit}
          className="rounded-lg border border-hairline-strong bg-paper-panel p-8 shadow-card"
        >
          <div className="flex items-center gap-3">
            <Seal size={40} />
            <div>
              <div className="font-display text-[20px] font-bold leading-none tracking-tight text-ink">
                Pramaan
              </div>
              <div className="kicker mt-1.5">First-run setup</div>
            </div>
          </div>

          <div className="my-6 border-t border-hairline" />

          <h1 className="font-display text-[19px] font-semibold text-ink">
            Create your workspace
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
            This deployment has no company data yet. Enter your organisation&apos;s details to
            create its private privacy-ops workspace. This can only be done once.
          </p>

          <div className="mt-5">
            <Field label="Company name" value={company} onChange={setCompany} placeholder="Acme Pvt. Ltd." />
            <Field
              label="Primary domain"
              value={domain}
              onChange={setDomain}
              placeholder="acme.in"
              hint="The website the consent banner will be installed on. A first property is created for this domain automatically."
            />
            <Field label="Data Protection Officer — name" value={dpoName} onChange={setDpoName} placeholder="Priya Sharma" />
            <Field
              label="Data Protection Officer — email"
              type="email"
              value={dpoEmail}
              onChange={setDpoEmail}
              placeholder="dpo@acme.in"
              hint="Used as the contact in privacy notices and breach notifications."
            />
          </div>

          {err && (
            <div className="mb-4 rounded-md border border-seal/30 bg-seal-bg px-3 py-2 text-[12.5px] font-medium text-seal-dark">
              {err}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn btn-ink w-full">
            {busy ? "Creating workspace…" : "Create workspace"}
          </button>
          <p className="mt-3.5 text-[12px] leading-relaxed text-ink-muted">
            The workspace creation is written to the evidence ledger as its first entry.
          </p>
        </form>
        <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          DPDP Act, 2023 · Evidence-first privacy operations
        </p>
      </div>
    </div>
  );
}
