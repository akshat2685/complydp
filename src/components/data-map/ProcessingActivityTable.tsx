"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Building2,
  Server,
  Layers,
  Search,
} from "lucide-react";
import { useComplyDP } from "@/context/AppContext";
import { ProcessingActivity } from "@/types";

export function ProcessingActivityTable() {
  const ctx = useComplyDP();
  const [search, setSearch] = useState("");

  const activities = ctx.processingActivities;

  const filtered = activities.filter(
    (act) =>
      act.name.toLowerCase().includes(search.toLowerCase()) ||
      act.purpose.toLowerCase().includes(search.toLowerCase()) ||
      act.dataCategories.some((c) => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-3">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activity, purpose, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Mandatory Record of Processing Activities (DPDP S.8 Compliance)
        </div>
      </div>

      {/* Structured Primary Table */}
      <div className="border border-slate-200 bg-white rounded-sm shadow-subtle overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="op-table-header">
              <th className="px-3.5 py-2">Processing Activity</th>
              <th className="px-3.5 py-2">Purpose of Processing</th>
              <th className="px-3.5 py-2">Legal Basis (DPDP)</th>
              <th className="px-3.5 py-2">Personal Data Categories</th>
              <th className="px-3.5 py-2">Systems & Vendors</th>
              <th className="px-3.5 py-2">Retention Period</th>
              <th className="px-3.5 py-2 text-right">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {filtered.map((act) => (
              <tr key={act.id} className="hover:bg-slate-50/80 transition">
                <td className="px-3.5 py-3 font-sans">
                  <div className="font-bold text-slate-900">{act.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Owner: {act.owner}
                  </div>
                </td>
                <td className="px-3.5 py-3 font-sans text-slate-700 max-w-xs leading-relaxed text-[11px]">
                  {act.purpose}
                </td>
                <td className="px-3.5 py-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      act.legalBasis === "Legal Obligation"
                        ? "bg-slate-100 text-slate-800"
                        : act.legalBasis === "Consent"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {act.legalBasis}
                  </span>
                </td>
                <td className="px-3.5 py-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {act.dataCategories.map((c) => (
                      <span
                        key={c}
                        className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3.5 py-3 text-slate-600">
                  <div className="text-[10px] font-sans">
                    <span className="font-semibold text-slate-800">Vendors:</span>{" "}
                    {act.vendors.join(", ")}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Assets: {act.systems.join(", ")}
                  </div>
                </td>
                <td className="px-3.5 py-3 text-slate-600 font-sans text-[11px]">
                  {act.retentionPeriod}
                </td>
                <td className="px-3.5 py-3 text-right">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                    {act.evidenceCount} proofs
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
