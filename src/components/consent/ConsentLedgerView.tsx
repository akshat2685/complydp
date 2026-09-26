"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sliders,
  Copy,
  Check,
  Hash,
  Search,
} from "lucide-react";
import { useComplyDP } from "@/context/AppContext";
import { ConsentEvent, ConsentEventType } from "@/types";

export function ConsentLedgerView() {
  const ctx = useComplyDP();
  const [filterType, setFilterType] = useState<string>("all");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const events = ctx.consentEvents;

  const filtered = events.filter((evt) => {
    const matchesType = filterType === "all" || evt.eventType === filterType;
    const matchesSearch =
      evt.visitorRef.toLowerCase().includes(search.toLowerCase()) ||
      evt.evidenceHash.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getEventBadge = (type: ConsentEventType) => {
    switch (type) {
      case "consent_granted":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center w-fit space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>granted</span>
          </span>
        );
      case "consent_denied":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center w-fit space-x-1">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>denied</span>
          </span>
        );
      case "consent_withdrawn":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center w-fit space-x-1">
            <RotateCcw className="w-3 h-3 text-amber-600" />
            <span>withdrawn</span>
          </span>
        );
      case "preference_changed":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 flex items-center w-fit space-x-1">
            <Sliders className="w-3 h-3 text-blue-600" />
            <span>preference_changed</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Banner explaining Data Minimization & Cryptographic Proof */}
      <div className="bg-slate-900 text-slate-100 rounded-sm p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="font-semibold flex items-center space-x-1.5 text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>DPDP Consent Evidence Ledger</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Zero raw PII storage: Visitor references are pseudonymous SHA-256 tokens linked to immutable cryptographic receipts.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-mono shrink-0">
          <span className="text-slate-300">Notice Version:</span>
          <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-emerald-400">
            v2.1 (DPDP-Notice-2026.04)
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search visitor ref or proof hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-1 text-xs">
          {[
            { label: "All Events", value: "all" },
            { label: "Granted", value: "consent_granted" },
            { label: "Denied", value: "consent_denied" },
            { label: "Withdrawn", value: "consent_withdrawn" },
            { label: "Preference Changed", value: "preference_changed" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilterType(item.value)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filterType === item.value
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="border border-slate-200 bg-white rounded-sm shadow-subtle overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="op-table-header">
              <th className="px-3.5 py-2">Timestamp (IST)</th>
              <th className="px-3.5 py-2">Event Action</th>
              <th className="px-3.5 py-2">Pseudonymous Visitor Ref</th>
              <th className="px-3.5 py-2">Permitted Categories</th>
              <th className="px-3.5 py-2">Notice Version</th>
              <th className="px-3.5 py-2">Evidence Hash (Proof)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {filtered.map((evt) => (
              <tr key={evt.id} className="hover:bg-slate-50/80 transition">
                <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">
                  {new Date(evt.timestamp).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    day: "2-digit",
                    month: "short",
                  })}
                </td>
                <td className="px-3.5 py-2.5 font-sans">{getEventBadge(evt.eventType)}</td>
                <td className="px-3.5 py-2.5 text-slate-900 font-medium">
                  {evt.visitorRef.slice(0, 18)}...
                </td>
                <td className="px-3.5 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {evt.categories.map((c) => (
                      <span
                        key={c}
                        className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3.5 py-2.5 text-slate-500 font-sans text-[11px]">
                  {evt.bannerVersion}
                </td>
                <td className="px-3.5 py-2.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      {evt.evidenceHash.slice(0, 14)}...
                    </span>
                    <button
                      onClick={() => handleCopy(evt.evidenceHash)}
                      title="Copy full cryptographic hash"
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                    >
                      {copiedHash === evt.evidenceHash ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
