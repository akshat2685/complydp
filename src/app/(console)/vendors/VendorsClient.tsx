"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHead, Card, CardTitle, Chip, EmptyState, Drawer } from "@/components/ui";
import { Plus, Globe } from "lucide-react";
import type { VendorRow } from "./page";

const DPA_OPTIONS = ["not_started", "under_review", "signed", "not_required"] as const;
const DPA_LABELS: Record<string, string> = {
  signed: "DPA signed",
  under_review: "Under review",
  not_started: "Not started",
  not_required: "Not required",
};
const DPA_TONES: Record<string, "green" | "amber" | "red" | "mute"> = {
  signed: "green",
  under_review: "amber",
  not_started: "red",
  not_required: "mute",
};
const RISK_OPTIONS = ["low", "medium", "high", "critical"] as const;
const RISK_TONES: Record<string, "green" | "amber" | "red" | "seal"> = {
  low: "green",
  medium: "amber",
  high: "red",
  critical: "seal",
};

async function post(url: string, payload: unknown) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error((await r.json()).error ?? "Request failed");
  return r.json();
}

async function patch(url: string, payload: unknown) {
  const r = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error((await r.json()).error ?? "Request failed");
  return r.json();
}

function VendorDrawer({ vendor, onClose }: { vendor: VendorRow; onClose: () => void }) {
  const router = useRouter();
  const [notes, setNotes] = useState(vendor.notes);
  const [owner, setOwner] = useState(vendor.owner);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await patch("/api/vendors", { id: vendor.id, notes, owner });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer title={vendor.name} kicker="Vendor file" onClose={onClose}>
      <div className="space-y-4 text-[13px]">
        <div className="flex flex-wrap gap-1.5">
          <Chip tone={DPA_TONES[vendor.dpa_status] ?? "mute"}>{DPA_LABELS[vendor.dpa_status] ?? vendor.dpa_status}</Chip>
          <Chip tone={RISK_TONES[vendor.risk_tier] ?? "mute"}>risk: {vendor.risk_tier}</Chip>
          {vendor.country !== "India" && (
            <Chip tone="amber"><Globe className="w-3 h-3" /> cross-border — {vendor.country}</Chip>
          )}
          {vendor.discovered_via === "cookie_scan" && <Chip tone="teal">auto-discovered</Chip>}
        </div>

        <div className="divide-y divide-dashed divide-hairline">
          {[
            ["Category", vendor.category || "—"],
            ["Domain", vendor.domain || "—"],
            ["Country", vendor.country || "—"],
            ["Discovered via", vendor.discovered_via === "cookie_scan" ? "Cookie scan" : "Manual entry"],
            ["On register since", new Date(vendor.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })],
          ].map(([k, v]) => (
            <div key={k} className="rule-row flex justify-between py-2">
              <span className="text-ink-faint">{k}</span>
              <span className="font-semibold text-ink font-mono text-[12px]">{v}</span>
            </div>
          ))}
        </div>

        <div>
          <label className="kicker block mb-1.5">Owner</label>
          <input className="field" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Team or person accountable" />
        </div>

        <div>
          <label className="kicker block mb-1.5">DPA notes</label>
          <textarea
            className="field min-h-[120px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Negotiation status, clauses requested, renewal dates…"
          />
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-seal btn-sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save notes"}
          </button>
          {saved && <span className="text-[12px] text-status-green font-semibold">Saved to the ledger.</span>}
        </div>
      </div>
    </Drawer>
  );
}

export function VendorsClient({ vendors }: { vendors: VendorRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<VendorRow | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [domain, setDomain] = useState("");
  const [country, setCountry] = useState("India");
  const [owner, setOwner] = useState("");
  const [err, setErr] = useState("");
  const [updating, setUpdating] = useState("");

  const stats = useMemo(() => {
    const s = { signed: 0, under_review: 0, not_started: 0, high: 0 };
    for (const v of vendors) {
      if (v.dpa_status === "signed") s.signed++;
      else if (v.dpa_status === "under_review") s.under_review++;
      else if (v.dpa_status === "not_started") s.not_started++;
      if (v.risk_tier === "high" || v.risk_tier === "critical") s.high++;
    }
    return s;
  }, [vendors]);

  const setDpa = async (id: string, dpa_status: string) => {
    setUpdating(id);
    try {
      await patch("/api/vendors", { id, dpa_status });
      router.refresh();
    } finally {
      setUpdating("");
    }
  };

  const setRisk = async (id: string, risk_tier: string) => {
    setUpdating(id);
    try {
      await patch("/api/vendors", { id, risk_tier });
      router.refresh();
    } finally {
      setUpdating("");
    }
  };

  const submit = async () => {
    setErr("");
    try {
      await post("/api/vendors", { name, category, domain, country, owner });
      router.refresh();
      setOpen(false);
      setName(""); setCategory(""); setDomain(""); setCountry("India"); setOwner("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const statCards = [
    { label: "DPA signed", value: stats.signed, tone: "text-status-green" },
    { label: "DPA under review", value: stats.under_review, tone: "text-status-amber" },
    { label: "DPA not started", value: stats.not_started, tone: "text-status-red" },
    { label: "High / critical risk", value: stats.high, tone: stats.high > 0 ? "text-seal" : "text-ink" },
  ];

  return (
    <div>
      <PageHead
        kicker="Vendor management"
        title="Processors & vendors"
        lede="Every vendor that touches personal data, with its DPA state. Trackers found by the cookie scan register here automatically."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((s) => (
          <Card key={s.label}>
            <div className={`font-display text-[30px] font-bold leading-none ${s.tone}`}>{s.value}</div>
            <div className="text-[12px] text-ink-muted mt-1.5">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card pad={false}>
        <div className="p-5 pb-3 flex items-center justify-between">
          <CardTitle right={<span className="kicker">{vendors.length} vendors</span>}>
            Register
          </CardTitle>
          <button className="btn btn-ink btn-sm" onClick={() => setOpen(!open)}>
            <Plus className="w-3.5 h-3.5" /> Register vendor
          </button>
        </div>

        {open && (
          <div className="px-5 pb-4 border-b border-hairline">
            <div className="grid md:grid-cols-3 gap-3">
              <input className="field" placeholder="Vendor name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="field" placeholder="Category — e.g. Payments" value={category} onChange={(e) => setCategory(e.target.value)} />
              <input className="field font-mono" placeholder="Domain — e.g. example.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
              <input className="field" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
              <input className="field" placeholder="Owner team" value={owner} onChange={(e) => setOwner(e.target.value)} />
            </div>
            {err && <p className="text-[12px] text-status-red mt-2">{err}</p>}
            <div className="mt-3 flex gap-2">
              <button className="btn btn-seal btn-sm" onClick={submit} disabled={!name.trim()}>Register</button>
              <button className="btn btn-line btn-sm" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </div>
        )}

        {vendors.length === 0 ? (
          <div className="px-5 pb-5 pt-4">
            <EmptyState title="No vendors registered" body="Register your first vendor above, or run a cookie scan from Consent — discovered trackers register here automatically." />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="ledger-head">
                <th className="text-left px-5 py-2 font-semibold">Vendor</th>
                <th className="text-left px-3 py-2 font-semibold hidden md:table-cell">Domain</th>
                <th className="text-left px-3 py-2 font-semibold">DPA status</th>
                <th className="text-left px-3 py-2 font-semibold hidden lg:table-cell">Risk</th>
                <th className="text-right px-5 py-2 font-semibold hidden md:table-cell">Owner</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="ledger-row cursor-pointer" onClick={() => setSelected(v)}>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-bold text-ink">{v.name}</span>
                      {v.country !== "India" && (
                        <Chip tone="amber" dot={false}><Globe className="w-3 h-3" /> cross-border · {v.country}</Chip>
                      )}
                      {v.discovered_via === "cookie_scan" && <Chip tone="teal" dot={false}>auto-discovered</Chip>}
                    </div>
                    {v.category && <div className="text-[11px] text-ink-faint mt-0.5">{v.category}</div>}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[12px] text-ink-muted hidden md:table-cell">{v.domain || "—"}</td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      className="field !w-auto !py-1 !text-[12px]"
                      value={v.dpa_status}
                      disabled={updating === v.id}
                      onChange={(e) => setDpa(v.id, e.target.value)}
                    >
                      {DPA_OPTIONS.map((o) => (
                        <option key={o} value={o}>{DPA_LABELS[o]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                    <select
                      className="field !w-auto !py-1 !text-[12px]"
                      value={v.risk_tier}
                      disabled={updating === v.id}
                      onChange={(e) => setRisk(v.id, e.target.value)}
                    >
                      {RISK_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-2.5 text-right text-[12.5px] text-ink-muted hidden md:table-cell">
                    {v.owner || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="px-5 py-3 text-[11.5px] text-ink-faint border-t border-hairline">
          Click a row for the full vendor file. Every change is written to the evidence ledger.
        </p>
      </Card>

      {selected && <VendorDrawer vendor={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
