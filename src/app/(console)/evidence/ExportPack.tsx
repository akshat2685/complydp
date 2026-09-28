"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function ExportPack() {
  const [type, setType] = useState("dsr_case");
  const [id, setId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function exportPack(e: React.FormEvent) {
    e.preventDefault();
    if (!id.trim()) {
      setStatus("Enter an entity id to export.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity_type: type, entity_id: id.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Export failed.");
        return;
      }
      const blob = new Blob([JSON.stringify(data.pack, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evidence-pack-${type}-${id.trim()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      const n = (data.pack.entries as unknown[]).length;
      setStatus(
        n > 0
          ? `Exported ${n} entr${n === 1 ? "y" : "ies"} — the export wrote its own entry to the ledger.`
          : "No ledger entries exist for that entity."
      );
    } catch {
      setStatus("Export failed — the server could not be reached.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-paper-panel border border-hairline rounded-md shadow-card p-5 mt-6">
      <h2 className="font-display text-[16px] font-bold text-ink mb-1">Export evidence pack</h2>
      <p className="text-[12.5px] text-ink-muted mb-4 max-w-2xl">
        Pull every ledger entry for one entity into a signed JSON pack. The pack includes a
        chain-verification receipt, so anyone holding it can confirm it has not been altered.
      </p>
      <form onSubmit={exportPack} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="kicker block mb-1.5" htmlFor="xet">
            Entity type
          </label>
          <input id="xet" className="field font-mono" style={{ width: 200 }} value={type} onChange={(e) => setType(e.target.value)} />
        </div>
        <div>
          <label className="kicker block mb-1.5" htmlFor="xeid">
            Entity id
          </label>
          <input
            id="xeid"
            className="field font-mono"
            style={{ width: 260 }}
            placeholder="e.g. breach_001"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </div>
        <button type="submit" disabled={busy} className="btn btn-line btn-sm">
          <Download className="w-3.5 h-3.5" />
          {busy ? "Exporting…" : "Download pack"}
        </button>
      </form>
      {status && <p className="text-[12.5px] text-ink-soft mt-3">{status}</p>}
    </div>
  );
}
