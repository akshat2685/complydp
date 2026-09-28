import { Suspense } from "react";
import { db, parseJson, ledgerVerify } from "@/server/db";
import { PageHead, ProofSeal, EmptyState, Card, CardTitle } from "@/components/ui";
import { ChainStatusCard } from "./ChainStatus";
import { LedgerFilter } from "./LedgerFilter";
import { ExportPack } from "./ExportPack";

interface Entry {
  seq: number;
  ts: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  summary: string;
  details_json: string;
  prev_hash: string;
  entry_hash: string;
}

function fmtTime(ts: string) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EvidencePage({
  searchParams,
}: {
  searchParams: Promise<{ entity_type?: string; entity_id?: string }>;
}) {
  const sp = await searchParams;
  const d = db();

  const v = ledgerVerify(d);
  const chain = { ok: v.ok, checked: v.checked, brokenAt: v.brokenAt ?? null };

  const types = (
    d.prepare(`SELECT DISTINCT entity_type AS t FROM evidence_ledger ORDER BY t`).all() as Array<{ t: string }>
  ).map((r) => r.t);

  const et = (sp.entity_type ?? "").trim();
  const eid = (sp.entity_id ?? "").trim();
  let entries: Entry[];
  if (et && eid) {
    entries = d
      .prepare(`SELECT * FROM evidence_ledger WHERE entity_type = ? AND entity_id = ? ORDER BY seq DESC LIMIT 100`)
      .all(et, eid) as unknown as Entry[];
  } else if (et) {
    entries = d
      .prepare(`SELECT * FROM evidence_ledger WHERE entity_type = ? ORDER BY seq DESC LIMIT 100`)
      .all(et) as unknown as Entry[];
  } else {
    entries = d.prepare(`SELECT * FROM evidence_ledger ORDER BY seq DESC LIMIT 100`).all() as unknown as Entry[];
  }
  const filtering = Boolean(et || eid);

  return (
    <div>
      <PageHead
        kicker="Evidence"
        title="The tamper-evident ledger"
        lede="Every consent, request, breach action and finding in this registry is appended to a SHA-256 hash chain. Verify it any time."
      />

      <ChainStatusCard initial={chain} />

      <Card pad={false}>
        <div className="p-5 pb-2">
          <CardTitle right={<span className="kicker">{entries.length} shown</span>}>
            Ledger entries
          </CardTitle>
          <Suspense fallback={<div className="text-[12px] text-ink-faint py-2">Loading filter…</div>}>
            <LedgerFilter entityTypes={types} />
          </Suspense>
        </div>

        {entries.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              title="No entries match"
              body={
                filtering
                  ? "Nothing in the ledger matches that filter. Check the entity type and id, or clear the filter."
                  : "The ledger is empty. Any action taken in the registry will appear here."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead>
                <tr className="ledger-head">
                  <th className="text-left px-5 py-2 font-semibold">Seq</th>
                  <th className="text-left px-3 py-2 font-semibold">Time</th>
                  <th className="text-left px-3 py-2 font-semibold hidden lg:table-cell">Actor</th>
                  <th className="text-left px-3 py-2 font-semibold">Action</th>
                  <th className="text-left px-3 py-2 font-semibold">Entity</th>
                  <th className="text-left px-3 py-2 font-semibold">Summary</th>
                  <th className="text-right px-5 py-2 font-semibold">Seal</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const details = parseJson<Record<string, unknown>>(e.details_json, {});
                  const hasDetails = Object.keys(details).length > 0;
                  return (
                    <tr key={e.seq} className="ledger-row align-top">
                      <td className="px-5 py-2.5 font-mono text-[12px] text-ink-faint whitespace-nowrap">#{e.seq}</td>
                      <td className="px-3 py-2.5 text-[12px] text-ink-muted whitespace-nowrap">{fmtTime(e.ts)}</td>
                      <td className="px-3 py-2.5 text-[12px] text-ink-muted hidden lg:table-cell">{e.actor}</td>
                      <td className="px-3 py-2.5 font-mono text-[11.5px] text-ink whitespace-nowrap">{e.action}</td>
                      <td className="px-3 py-2.5 font-mono text-[11.5px] text-ink-muted whitespace-nowrap">
                        {e.entity_type}
                        <span className="text-ink-faint">:</span>
                        {e.entity_id}
                      </td>
                      <td className="px-3 py-2.5 text-[12.5px] text-ink leading-snug min-w-[220px]">
                        {e.summary}
                        {hasDetails && (
                          <details className="mt-1">
                            <summary className="text-[11px] font-semibold text-teal cursor-pointer hover:underline">
                              details
                            </summary>
                            <pre className="font-mono text-[10.5px] text-ink-soft bg-paper border border-hairline rounded p-2 mt-1 overflow-x-auto">
                              {JSON.stringify(details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right whitespace-nowrap">
                        <ProofSeal hash={e.entry_hash} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ExportPack />

      <p className="text-[12px] text-ink-faint mt-6 max-w-2xl leading-relaxed">
        The ledger is append-only. There is no edit or delete — the API refuses them outright — so a
        correction is always a new entry chained after the mistake, never a rewrite of history.
      </p>
    </div>
  );
}
