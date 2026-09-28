"use client";

import { useState } from "react";
import { Seal, Chip } from "@/components/ui";

interface ChainState {
  ok: boolean;
  checked: number;
  brokenAt: number | null;
}

export function ChainStatusCard({
  initial,
}: {
  initial: ChainState;
}) {
  const [chain, setChain] = useState<ChainState>(initial);
  const [verifying, setVerifying] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);

  async function reverify() {
    setVerifying(true);
    try {
      const res = await fetch("/api/evidence?verify=1");
      const data = await res.json();
      const v = data.verify as { ok: boolean; checked: number; brokenAt?: number };
      setChain({ ok: v.ok, checked: v.checked, brokenAt: v.brokenAt ?? null });
      setVerifiedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="bg-paper-panel border border-hairline rounded-md shadow-card p-6 mb-6">
      <div className="flex flex-wrap items-center gap-6">
        <div className="seal-stamp">
          <Seal size={76} />
        </div>
        <div className="flex-1 min-w-[220px]">
          <div className="kicker mb-1.5">Chain of custody</div>
          {chain.ok ? (
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-display text-[22px] font-bold text-ink">Chain valid</span>
              <Chip tone="green">verified</Chip>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-display text-[22px] font-bold text-status-red">Chain broken</span>
              <Chip tone="red">tamper detected</Chip>
            </div>
          )}
          <p className="text-[12.5px] text-ink-muted mt-1.5 max-w-xl">
            {chain.ok
              ? `${chain.checked} entries re-hashed and re-linked end to end.`
              : `Linkage failed at entry #${chain.brokenAt}. Treat every later entry as suspect.`}
            {verifiedAt && (
              <span className="font-mono text-[11px] text-ink-faint"> · last checked {verifiedAt}</span>
            )}
          </p>
          <p className="font-mono text-[11px] text-ink-faint mt-2 bg-paper border border-hairline rounded px-2.5 py-1.5 inline-block">
            entry_hash = SHA-256(prev_hash | timestamp | actor | action | entity | details)
          </p>
        </div>
        <button onClick={reverify} disabled={verifying} className="btn btn-ink btn-sm shrink-0">
          {verifying ? "Verifying…" : "Re-verify chain"}
        </button>
      </div>
    </div>
  );
}
