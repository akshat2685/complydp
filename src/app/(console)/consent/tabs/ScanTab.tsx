"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radar, Plus, AlertTriangle } from "lucide-react";
import { Card, CardTitle, Chip, EmptyState } from "@/components/ui";
import type { CookieRow } from "../types";
import { CATEGORY_TONES, CATEGORIES } from "../types";

interface ScanCookie {
  name: string;
  category: string;
  vendor_hint: string;
  duration: string;
  evidence: string;
}

export function ScanTab({ initialCookies }: { initialCookies: CookieRow[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("meridianfoods.in");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<null | {
    pages_crawled: number;
    cookies: ScanCookie[];
    added: number;
    seen: number;
    note: string;
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  async function runScan() {
    setScanning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      setResult(data);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="kicker block mb-1.5">Website to scan</label>
            <input
              className="field font-mono"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com"
              onKeyDown={(e) => e.key === "Enter" && runScan()}
            />
          </div>
          <button className="btn btn-ink" onClick={runScan} disabled={scanning || !url.trim()}>
            <Radar className="w-4 h-4" />
            {scanning ? "Scanning…" : "Run cookie scan"}
          </button>
        </div>
        <p className="text-[12px] text-ink-muted mt-3 border-t border-dashed border-hairline pt-3">
          <strong className="text-ink">Honest limits:</strong> this is a static scan — it fetches
          pages server-side without executing JavaScript. Cookies set only by client-side scripts
          may be missed. Anything it finds but cannot classify lands in the attention queue.
        </p>
        {error && (
          <div className="flex items-center gap-2 mt-3 text-[13px] font-semibold text-status-red bg-status-redBg border border-status-red/30 rounded-md px-3.5 py-2.5">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
        {result && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["Pages crawled", result.pages_crawled],
              ["Cookies found", result.cookies.length],
              ["New this scan", result.added],
              ["Already known", result.seen],
            ].map(([label, n]) => (
              <div key={label as string} className="bg-paper border border-hairline rounded-md px-3.5 py-2.5">
                <div className="font-display text-[22px] font-bold text-ink">{n as number}</div>
                <div className="text-[11.5px] text-ink-muted">{label as string}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card pad={false}>
        <div className="p-5 pb-3 flex items-center justify-between">
          <div>
            <CardTitle>Cookie inventory</CardTitle>
            <p className="text-[11.5px] text-ink-muted mt-1">
              Known-cookie library: {initialCookies.length} entries
            </p>
          </div>
          <button className="btn btn-line btn-sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-3.5 h-3.5" /> Add manually
          </button>
        </div>
        {showAdd && <AddCookieForm onDone={() => { setShowAdd(false); router.refresh(); }} />}
        {initialCookies.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState title="No cookies inventoried" body="Run a scan above, or add cookies manually." />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="ledger-head">
                <th className="text-left px-5 py-2">Cookie</th>
                <th className="text-left px-3 py-2">Category</th>
                <th className="text-left px-3 py-2 hidden lg:table-cell">Vendor</th>
                <th className="text-left px-3 py-2 hidden md:table-cell">Duration</th>
                <th className="text-left px-3 py-2 hidden xl:table-cell">Source</th>
              </tr>
            </thead>
            <tbody>
              {initialCookies.map((c) => (
                <CookieRowView key={c.id} cookie={c} />
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function CookieRowView({ cookie }: { cookie: CookieRow }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function reclassify(category: string) {
    setSaving(true);
    await fetch("/api/cookies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cookie.id, category }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <tr className="ledger-row">
      <td className="px-5 py-2.5">
        <div className="font-mono text-[12.5px] font-semibold text-ink">{cookie.name}</div>
        {cookie.description && <div className="text-[11.5px] text-ink-muted mt-0.5 max-w-md">{cookie.description}</div>}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Chip tone={CATEGORY_TONES[cookie.category] ?? "mute"}>{cookie.category}</Chip>
          <select
            className="field !w-auto !py-1 !px-2 !text-[11px]"
            value={cookie.category}
            disabled={saving}
            onChange={(e) => reclassify(e.target.value)}
            aria-label={`Reclassify ${cookie.name}`}
            title="Admin override — reclassify"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </td>
      <td className="px-3 py-2.5 text-[12.5px] text-ink-soft hidden lg:table-cell">{cookie.vendor_hint || "—"}</td>
      <td className="px-3 py-2.5 text-[12.5px] text-ink-soft hidden md:table-cell">{cookie.duration || "—"}</td>
      <td className="px-3 py-2.5 hidden xl:table-cell">
        <Chip tone={cookie.source === "manual" ? "seal" : "teal"} dot={false}>{cookie.source}</Chip>
      </td>
    </tr>
  );
}

function AddCookieForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("unclassified");
  const [vendor, setVendor] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/cookies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), category, vendor_hint: vendor }),
    });
    setSaving(false);
    onDone();
  }

  return (
    <div className="mx-5 mb-4 border border-hairline-strong rounded-md bg-paper p-4">
      <div className="kicker mb-3">New cookie — manual entry</div>
      <div className="grid md:grid-cols-4 gap-3">
        <input className="field font-mono" placeholder="cookie_name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="field" placeholder="Vendor (optional)" value={vendor} onChange={(e) => setVendor(e.target.value)} />
        <button className="btn btn-seal btn-sm" onClick={submit} disabled={saving || !name.trim()}>
          {saving ? "Adding…" : "Add cookie"}
        </button>
      </div>
    </div>
  );
}
