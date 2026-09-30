"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle, Chip } from "@/components/ui";

export function GitHubSettings({ initial }: { initial: { configured: boolean; masked: string | null } }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [configured, setConfigured] = useState(initial.configured);
  const [masked, setMasked] = useState(initial.masked);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const res = await fetch("/api/settings/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed.");
        return;
      }
      setConfigured(data.configured);
      setMasked(data.masked);
      setToken("");
      setSaved("Saved. The token is stored server-side and never shown again.");
      router.refresh();
    } catch {
      setError("Save failed — the server could not be reached.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const res = await fetch("/api/settings/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Remove failed.");
        return;
      }
      setConfigured(false);
      setMasked(null);
      setSaved("Token removed. Scans now run unauthenticated.");
      router.refresh();
    } catch {
      setError("Remove failed — the server could not be reached.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardTitle
        right={configured ? <Chip tone="green">connected</Chip> : <Chip tone="amber">not configured</Chip>}
      >
        GitHub connection
      </CardTitle>
      <p className="text-[12.5px] text-ink-muted mb-4 max-w-2xl">
        A personal access token lets codebase scans read private repositories and raises the API
        limit to 5,000 requests/hour.{" "}
        <strong className="text-ink">Optional</strong> — without a token, scans run unauthenticated
        (60 req/hr) and can only read public repos.
      </p>

      {configured && masked && (
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-[12.5px] text-ink bg-paper-deep border border-hairline rounded px-2.5 py-1.5">
            {masked}
          </span>
          <button onClick={remove} disabled={busy} className="btn btn-line btn-sm">
            {busy ? "Working…" : "Remove token"}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <label className="kicker block mb-1.5" htmlFor="gh-token">
            {configured ? "Replace token" : "Personal access token"}
          </label>
          <input
            id="gh-token"
            className="field font-mono"
            type="password"
            autoComplete="new-password"
            placeholder="ghp_… or github_pat_…"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        <button onClick={save} disabled={busy || !token.trim()} className="btn btn-ink btn-sm">
          {busy ? "Saving…" : configured ? "Replace token" : "Save token"}
        </button>
      </div>

      {error && <p className="text-[12px] text-status-red mt-3">{error}</p>}
      {saved && <p className="text-[12px] text-teal-dark mt-3">{saved}</p>}
      <p className="text-[11.5px] text-ink-faint mt-3">
        Stored in the tenant settings on this machine; the API only ever returns the masked form
        above. Paste it in your GitHub account settings — never in chat or email.
      </p>
    </Card>
  );
}
