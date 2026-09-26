"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/common/AppShell";
import { useComplyDP } from "@/context/AppContext";
import {
  Building2,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Vendor } from "@/types";

export default function VendorsPage() {
  const ctx = useComplyDP();
  const [search, setSearch] = useState("");
  const [filterDpa, setFilterDpa] = useState<string>("All");

  const vendors = ctx.vendors;

  const filtered = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase()) ||
      v.country.toLowerCase().includes(search.toLowerCase());
    const matchesDpa = filterDpa === "All" || v.dpaStatus === filterDpa;
    return matchesSearch && matchesDpa;
  });

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Data Processors & Vendors Directory
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold">
                DPDP S.8(1) & S.16
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Continuous monitoring of third-party data processors, Data Processing Agreements (DPA), cross-border transfer compliance, and observed runtime scripts.
            </p>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search processor name, category, or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            {["All", "Signed & Current", "Under Review"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterDpa(st)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  filterDpa === st
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="border border-slate-200 bg-white rounded-sm shadow-subtle overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="op-table-header">
                <th className="px-3.5 py-2">Processor / Vendor</th>
                <th className="px-3.5 py-2">Category</th>
                <th className="px-3.5 py-2">Jurisdiction</th>
                <th className="px-3.5 py-2">DPA Status</th>
                <th className="px-3.5 py-2">Cross-Border Transfer</th>
                <th className="px-3.5 py-2">Data Categories Processed</th>
                <th className="px-3.5 py-2 text-right">Risk Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-3.5 py-3 font-sans">
                    <div className="font-bold text-slate-900">{vendor.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Last Audited: {vendor.lastAuditDate}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 font-sans text-slate-700">{vendor.category}</td>
                  <td className="px-3.5 py-3 text-slate-600">{vendor.country}</td>
                  <td className="px-3.5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        vendor.dpaStatus === "Signed & Current"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {vendor.dpaStatus}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-slate-700 font-sans text-[11px]">
                    {vendor.crossBorderTransfer}
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {vendor.dataCategoriesProcessed.map((cat) => (
                        <span
                          key={cat}
                          className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px]"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        vendor.riskRating === "Low"
                          ? "bg-emerald-50 text-emerald-700"
                          : vendor.riskRating === "Medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {vendor.riskRating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
