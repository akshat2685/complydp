"use client";

import { useEffect, useState } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid var(--hairline-strong)",
  borderRadius: 8,
  background: "var(--paper)",
  color: "var(--ink)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  marginBottom: 6,
};

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{props.label}</label>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        style={inputStyle}
      />
      {props.hint && (
        <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 5, lineHeight: 1.45 }}>
          {props.hint}
        </div>
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)", color: "var(--ink-muted)", fontSize: 14 }}>
        Checking workspace…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--paper)",
        padding: 24,
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: 440,
          background: "var(--panel)",
          border: "1px solid var(--hairline)",
          borderRadius: 12,
          padding: 32,
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 8 }}>
          Pramaan · First-run setup
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 650, color: "var(--ink)", margin: "0 0 6px" }}>
          Create your workspace
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--ink-muted)", margin: "0 0 22px", lineHeight: 1.55 }}>
          This deployment has no company data yet. Enter your organisation's details to create
          its private privacy-ops workspace. This can only be done once.
        </p>

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

        {err && (
          <div style={{ fontSize: 13, color: "#b3261e", background: "#fdecea", border: "1px solid #f5c6c0", borderRadius: 8, padding: "9px 12px", marginBottom: 16 }}>
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            width: "100%",
            padding: "11px 12px",
            fontSize: 14.5,
            fontWeight: 650,
            borderRadius: 8,
            border: "none",
            background: "var(--ink)",
            color: "var(--paper)",
            cursor: busy ? "wait" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Creating workspace…" : "Create workspace"}
        </button>
        <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: "14px 0 0", lineHeight: 1.5 }}>
          The workspace creation is written to the evidence ledger as its first entry.
        </p>
      </form>
    </div>
  );
}
