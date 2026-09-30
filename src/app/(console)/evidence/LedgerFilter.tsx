"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LedgerFilter({ entityTypes }: { entityTypes: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [type, setType] = useState(params.get("entity_type") ?? "");
  const [id, setId] = useState(params.get("entity_id") ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (type) q.set("entity_type", type);
    if (id.trim()) q.set("entity_id", id.trim());
    const qs = q.toString();
    router.push(qs ? `/evidence?${qs}` : "/evidence");
  }

  function clear() {
    setType("");
    setId("");
    router.push("/evidence");
  }

  return (
    <form onSubmit={apply} className="flex flex-wrap items-end gap-3 mb-4">
      <div>
        <label className="kicker block mb-1.5" htmlFor="et">
          Entity type
        </label>
        <select id="et" className="field" value={type} onChange={(e) => setType(e.target.value)} style={{ width: 200 }}>
          <option value="">All types</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="kicker block mb-1.5" htmlFor="eid">
          Entity id
        </label>
        <input
          id="eid"
          className="field font-mono"
          style={{ width: 260 }}
          placeholder="e.g. DSR-2026-0041"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-ink btn-sm">
          Filter
        </button>
        {(params.get("entity_type") || params.get("entity_id")) && (
          <button type="button" onClick={clear} className="btn btn-line btn-sm">
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
