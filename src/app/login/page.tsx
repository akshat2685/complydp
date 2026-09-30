"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const [key, setKey] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error === "service_not_configured" ? "Admin key is not configured on this deployment." : "Wrong key.");
      }
      window.location.href = next;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
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
          maxWidth: 380,
          background: "var(--panel)",
          border: "1px solid var(--hairline)",
          borderRadius: 12,
          padding: 32,
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 8 }}>
          Pramaan · Restricted
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 650, color: "var(--ink)", margin: "0 0 6px" }}>Console sign-in</h1>
        <p style={{ fontSize: 13.5, color: "var(--ink-muted)", margin: "0 0 20px", lineHeight: 1.5 }}>
          Enter the admin key to open the privacy-ops console.
        </p>
        <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>
          Admin key
        </label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoComplete="current-password"
          autoFocus
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 12px",
            fontSize: 14,
            border: "1px solid var(--hairline-strong)",
            borderRadius: 8,
            background: "#fff",
            color: "var(--ink)",
            marginBottom: 12,
          }}
        />
        {err && (
          <div style={{ fontSize: 13, color: "var(--seal)", marginBottom: 12 }}>{err}</div>
        )}
        <button
          type="submit"
          disabled={busy || !key}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 14,
            fontWeight: 650,
            color: "#fff",
            background: "var(--seal)",
            border: "none",
            borderRadius: 8,
            cursor: busy || !key ? "default" : "pointer",
            opacity: busy || !key ? 0.6 : 1,
          }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
