"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Seal } from "@/components/ui";

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
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-10">
      <div className="w-full max-w-[400px]">
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
              <div className="kicker mt-1.5">Privacy Evidence Registry</div>
            </div>
          </div>

          <div className="my-6 border-t border-hairline" />

          <h1 className="font-display text-[19px] font-semibold text-ink">Console sign-in</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
            Enter the admin key to open the privacy-ops console.
          </p>

          <label
            htmlFor="admin-key"
            className="mb-1.5 mt-5 block text-[12.5px] font-semibold text-ink-soft"
          >
            Admin key
          </label>
          <input
            id="admin-key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="current-password"
            autoFocus
            className="field"
          />
          {err && (
            <div className="mt-3 rounded-md border border-seal/30 bg-seal-bg px-3 py-2 text-[12.5px] font-medium text-seal-dark">
              {err}
            </div>
          )}
          <button type="submit" disabled={busy || !key} className="btn btn-seal mt-5 w-full">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          DPDP Act, 2023 · Evidence-first privacy operations
        </p>
      </div>
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
