"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";

export function DangerZone() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reset() {
    const confirmed = window.confirm(
      "Reset demo data?\n\nThis wipes every cookie, consent event, request, breach, finding and ledger entry, then restores the original demo seed. This cannot be undone."
    );
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Reset failed.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Reset failed — the server could not be reached.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-paper-panel border border-status-red/50 rounded-md shadow-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <TriangleAlert className="w-4 h-4 text-status-red" />
        <h2 className="font-display text-[16px] font-bold text-ink">Danger zone</h2>
      </div>
      <p className="text-[12.5px] text-ink-muted mb-4 max-w-2xl">
        Wipe the registry and restore the original demo seed — useful before a demo or after
        experimenting. The reset writes its own entry to the fresh ledger, so even the wipe is on
        record.
      </p>
      <button onClick={reset} disabled={busy} className="btn btn-seal btn-sm">
        {busy ? "Resetting…" : "Reset demo data"}
      </button>
      {error && <p className="text-[12.5px] text-status-red mt-3">{error}</p>}
    </div>
  );
}
