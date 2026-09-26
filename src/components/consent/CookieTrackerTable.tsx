"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";
import { DiscoveredCookie, CookieCategory } from "@/types";
import { useComplyDP } from "@/context/AppContext";
import { CookieClassificationDrawer } from "./CookieClassificationDrawer";

export function CookieTrackerTable() {
  const ctx = useComplyDP();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [selectedCookie, setSelectedCookie] = useState<DiscoveredCookie | null>(null);

  const cookies = ctx.webProperty.cookies;

  const filtered = cookies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.vendor.toLowerCase().includes(search.toLowerCase()) ||
      c.domain.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-3">
      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search cookie, vendor, or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
          {["All", "Necessary", "Analytics", "Advertising", "Functional", "Unknown"].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  categoryFilter === cat
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 bg-white rounded-sm shadow-subtle overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="op-table-header">
              <th className="px-3.5 py-2">Tracker / Cookie</th>
              <th className="px-3.5 py-2">Vendor / Processor</th>
              <th className="px-3.5 py-2">Category</th>
              <th className="px-3.5 py-2">Consent Required</th>
              <th className="px-3.5 py-2">Execution Timing</th>
              <th className="px-3.5 py-2">Review Status</th>
              <th className="px-3.5 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {filtered.map((cookie) => (
              <tr
                key={cookie.id}
                className="hover:bg-slate-50/80 transition cursor-pointer"
                onClick={() => setSelectedCookie(cookie)}
              >
                <td className="px-3.5 py-2.5">
                  <div className="font-bold text-slate-900">{cookie.name}</div>
                  <div className="text-[10px] text-slate-400">{cookie.domain}</div>
                </td>
                <td className="px-3.5 py-2.5 font-sans font-medium text-slate-800">
                  {cookie.vendor}
                </td>
                <td className="px-3.5 py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      cookie.category === "Necessary"
                        ? "bg-slate-100 text-slate-800"
                        : cookie.category === "Analytics"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : cookie.category === "Advertising"
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {cookie.category}
                  </span>
                </td>
                <td className="px-3.5 py-2.5">
                  {cookie.consentRequired ? (
                    <span className="text-amber-700 font-semibold">Yes (Prior Opt-In)</span>
                  ) : (
                    <span className="text-slate-400">Exempt</span>
                  )}
                </td>
                <td className="px-3.5 py-2.5">
                  {cookie.observedBeforeConsent ? (
                    <span className="text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center w-fit space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Pre-Consent (Gap)</span>
                    </span>
                  ) : (
                    <span className="text-emerald-700 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Post-Consent Only</span>
                    </span>
                  )}
                </td>
                <td className="px-3.5 py-2.5">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      cookie.approvalState === "Approved"
                        ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                        : "text-amber-800 bg-amber-50 border border-amber-200 font-semibold"
                    }`}
                  >
                    {cookie.approvalState}
                  </span>
                </td>
                <td className="px-3.5 py-2.5 text-right font-sans">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCookie(cookie);
                    }}
                    className="px-2 py-1 text-[11px] text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CookieClassificationDrawer
        cookie={selectedCookie}
        onClose={() => setSelectedCookie(null)}
        onApprove={(id, cat) => ctx.approveCookieClassification(id, cat)}
      />
    </div>
  );
}
