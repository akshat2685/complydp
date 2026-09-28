"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardTitle, Chip, EmptyState, ProofSeal } from "@/components/ui";
import type { GuardianConsent } from "../types";

/** Mask a contact for display. Full contact is only ever shown inside this console. */
function maskContact(c: string): string {
  if (c.includes("@")) {
    const [u, d] = c.split("@");
    return `${u.slice(0, 2)}•••@${d}`;
  }
  const digits = c.replace(/\D/g, "");
  return digits.length > 4 ? `••••••${digits.slice(-4)}` : "••••••";
}

function fmtTime(ts: string) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GuardiansTab({ initial }: { initial: GuardianConsent[] }) {
  const [consents, setConsents] = useState(initial);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const verified = consents.filter((c) => c.verified_at).length;

  async function verify(id: string) {
    setBusy(id);
    setErr(null);
    try {
      const r = await fetch(`/api/consent/guardian/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Verification failed");
      setConsents((cs) => cs.map((c) => (c.id === id ? { ...c, verified_at: j.verified_at } : c)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Guardian consents", consents.length, "text-ink"],
          ["Verified", verified, "text-ink"],
          ["Pending verification", consents.length - verified, consents.length - verified > 0 ? "text-status-amber" : "text-ink"],
          ["Ledger-chained", consents.length, "text-ink"],
        ].map(([label, v, tone]) => (
          <Card key={label as string}>
            <div className={`font-display text-[26px] font-bold leading-none ${tone}`}>{v}</div>
            <div className="text-[12px] text-ink-muted mt-1.5">{label as string}</div>
          </Card>
        ))}
      </div>

      <Card pad={false}>
        <div className="p-5 pb-3">
          <CardTitle right={<span className="kicker">Sensitive</span>}>Guardian consents</CardTitle>
          <p className="text-[12.5px] text-ink-muted -mt-1">
            Guardian contact details are stored so the org can reach guardians about their
            child&apos;s data. Flagged sensitive: shown only in this console (never on the
            public site), and the evidence ledger carries only a SHA-256 hash of the contact —
            never the contact itself.
          </p>
        </div>
        {err && (
          <div className="mx-5 mb-3 px-3 py-2 text-[12.5px] rounded border border-status-red/40 bg-status-red/10 text-status-red">
            {err}
          </div>
        )}
        {consents.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              title="No guardian consents yet"
              body="When an under-18 visitor's parent or guardian consents through the banner, their record appears here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="ledger-head">
                  <th className="text-left px-5 py-2">Time</th>
                  <th className="text-left px-3 py-2">Guardian</th>
                  <th className="text-left px-3 py-2">Relationship</th>
                  <th className="text-left px-3 py-2">Contact</th>
                  <th className="text-left px-3 py-2">Visitor</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-5 py-2">Proof</th>
                </tr>
              </thead>
              <tbody>
                {consents.map((c) => (
                  <tr key={c.id} className="ledger-row">
                    <td className="px-5 py-2.5 font-mono text-[11.5px] text-ink-soft whitespace-nowrap">
                      {fmtTime(c.created_at)}
                    </td>
                    <td className="px-3 py-2.5 text-[12.5px] font-semibold text-ink whitespace-nowrap">
                      {c.guardian_name}
                    </td>
                    <td className="px-3 py-2.5">
                      <Chip tone="mute">{c.relationship}</Chip>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11.5px] text-ink-soft whitespace-nowrap">
                      {revealed[c.id] ? c.contact : maskContact(c.contact)}{" "}
                      <button
                        type="button"
                        onClick={() => setRevealed((r) => ({ ...r, [c.id]: !r[c.id] }))}
                        className="underline text-ink-faint hover:text-ink"
                        title="Reveal the full contact. It never leaves this console."
                      >
                        {revealed[c.id] ? "mask" : "reveal"}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11.5px] text-ink-muted" title={c.visitor_hash}>
                      {c.visitor_hash.slice(0, 10)}…
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {c.verified_at ? (
                        <Chip tone="teal">verified</Chip>
                      ) : (
                        <button
                          type="button"
                          disabled={busy === c.id}
                          onClick={() => verify(c.id)}
                          className="text-[12px] font-semibold px-3 py-1.5 rounded border border-seal bg-seal/10 text-ink hover:bg-seal/20 disabled:opacity-50"
                        >
                          {busy === c.id ? "Verifying…" : "Verify"}
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <ProofSeal hash={c.contact_hash} />
                        <Link
                          href={`/evidence?entity_type=guardian_consent&entity_id=${c.id}`}
                          className="text-[11.5px] underline text-ink-faint hover:text-ink whitespace-nowrap"
                        >
                          ledger entry
                        </Link>
                      </div>
                    </td>
                  </tr>
            ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="font-mono text-[11px] text-ink-faint">
        Proof column shows the contact hash stamped in the evidence ledger — it matches the
        contact stored here without exposing it. Verification records who confirmed the
        guardian&apos;s identity and when.
      </p>
    </div>
  );
}
