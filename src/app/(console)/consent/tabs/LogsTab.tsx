"use client";

import { Card, CardTitle, Chip, EmptyState, ProofSeal } from "@/components/ui";
import type { ConsentEvent } from "../types";

const CAT_KEYS = ["necessary", "functional", "analytics", "marketing"] as const;
const CAT_SHORT: Record<string, string> = { necessary: "N", functional: "F", analytics: "A", marketing: "M" };

export function LogsTab({ events }: { events: ConsentEvent[] }) {
  const adults = events.filter((e) => e.age_band !== "under18").length;
  const minors = events.length - adults;
  const marketingOptIn = events.filter((e) => e.categories.marketing).length;
  const optInRate = events.length > 0 ? Math.round((marketingOptIn / events.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Total choices logged", events.length, "text-ink"],
          ["Adult visitors", adults, "text-ink"],
          ["Under-18 visitors", minors, minors > 0 ? "text-status-amber" : "text-ink"],
          ["Marketing opt-in rate", `${optInRate}%`, "text-ink"],
        ].map(([label, v, tone]) => (
          <Card key={label as string}>
            <div className={`font-display text-[26px] font-bold leading-none ${tone}`}>{v}</div>
            <div className="text-[12px] text-ink-muted mt-1.5">{label as string}</div>
          </Card>
        ))}
      </div>

      <Card pad={false}>
        <div className="p-5 pb-3">
          <CardTitle right={<span className="kicker">Append-only</span>}>Consent log</CardTitle>
          <p className="text-[12.5px] text-ink-muted -mt-1">
            Each event embeds the hash of the previous one — tampering anywhere breaks the
            chain. Events cannot be edited or deleted, only superseded by newer choices.
          </p>
        </div>
        {events.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              title="No consent recorded yet"
              body="Install the snippet on your site and choices will appear here as hash-chained evidence."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="ledger-head">
                  <th className="text-left px-5 py-2">Time</th>
                  <th className="text-left px-3 py-2">Visitor</th>
                  <th className="text-left px-3 py-2">Age</th>
                  <th className="text-left px-3 py-2">Categories</th>
                  <th className="text-left px-3 py-2">Mode</th>
                  <th className="text-left px-5 py-2">Proof</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="ledger-row">
                    <td className="px-5 py-2.5 font-mono text-[11.5px] text-ink-soft whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString("en-IN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11.5px] text-ink-muted" title={e.visitor_hash}>
                      {e.visitor_hash.slice(0, 10)}…
                    </td>
                    <td className="px-3 py-2.5">
                      {e.age_band === "under18" ? (
                        <Chip tone="amber">under 18</Chip>
                      ) : (
                        <Chip tone="mute">adult</Chip>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        {CAT_KEYS.map((k) => (
                          <span
                            key={k}
                            title={`${k}: ${e.categories[k] ? "allowed" : "denied"}`}
                            className={`w-6 h-6 rounded text-[10px] font-mono font-bold flex items-center justify-center border ${
                              e.categories[k]
                                ? "bg-teal-bg text-teal border-teal/30"
                                : "bg-paper-deep text-ink-faint border-hairline line-through"
                            }`}
                          >
                            {CAT_SHORT[k]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-ink-soft font-mono">{e.consent_mode}</td>
                    <td className="px-5 py-2.5">
                      <ProofSeal hash={e.event_hash} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="font-mono text-[11px] text-ink-faint">
        N necessary · F functional · A analytics · M marketing — struck through means denied.
        Notice version is stamped per event.
      </p>
    </div>
  );
}

