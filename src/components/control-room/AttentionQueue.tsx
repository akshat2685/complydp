"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Filter,
  Eye,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Finding, FindingType } from "@/types";
import { useComplyDP } from "@/context/AppContext";
import { FindingDrawer } from "./FindingDrawer";

export function AttentionQueue() {
  const ctx = useComplyDP();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const pendingFindings = ctx.findings.filter((f) => f.status === "Needs Review");

  const categories = [
    { label: "All Attention Items", value: "All", count: pendingFindings.length },
    {
      label: "Consent",
      value: "Consent",
      count: pendingFindings.filter((f) => f.category === "Consent").length,
    },
    {
      label: "Discovery",
      value: "Discovery",
      count: pendingFindings.filter((f) => f.category === "Discovery").length,
    },
    {
      label: "Request SLA",
      value: "Request",
      count: pendingFindings.filter((f) => f.category === "Request").length,
    },
    {
      label: "Incidents",
      value: "Incident",
      count: pendingFindings.filter((f) => f.category === "Incident").length,
    },
    {
      label: "Vendors",
      value: "Vendor",
      count: pendingFindings.filter((f) => f.category === "Vendor").length,
    },
    {
      label: "Evidence",
      value: "Evidence",
      count: pendingFindings.filter((f) => f.category === "Evidence").length,
    },
  ];

  const filteredFindings =
    activeCategory === "All"
      ? pendingFindings
      : pendingFindings.filter((f) => f.category === activeCategory);

  return (
    <div className="space-y-3">
      {/* Category Pills Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-2.5 py-1 text-xs font-medium rounded-sm transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeCategory === cat.value
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`px-1 text-[10px] font-mono rounded ${
                activeCategory === cat.value
                  ? "bg-slate-700 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Dense Table Card */}
      <div className="border border-slate-200 bg-white rounded-sm shadow-subtle overflow-hidden">
        <div className="op-table-header px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>Operational Findings Requiring Human Review</span>
            <span className="font-mono text-slate-400 font-normal">
              ({filteredFindings.length} active)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Sorted by Regulatory Urgency
          </span>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <div className="font-semibold text-slate-700">All attention items in this category resolved</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Continuous sensors are running. New findings will populate automatically.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredFindings.map((finding) => (
              <div
                key={finding.id}
                className="px-4 py-3 hover:bg-slate-50/80 transition flex items-start justify-between gap-4 cursor-pointer"
                onClick={() => setSelectedFinding(finding)}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded ${
                        finding.severity === "Critical"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : finding.severity === "High"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                      {finding.type}
                    </span>
                    <h3 className="text-xs font-semibold text-slate-900 truncate">
                      {finding.title}
                    </h3>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-1">
                    {finding.whyItMatters}
                  </p>

                  <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-mono pt-0.5">
                    <span>Source: {finding.source}</span>
                    <span>•</span>
                    <span>Confidence: {finding.evidence.confidence}%</span>
                    <span>•</span>
                    <span>
                      Observed:{" "}
                      {new Date(finding.detectedAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      IST
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0 pt-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      ctx.resolveFinding(finding.id, "Quick resolved by DPO");
                    }}
                    title="Quick Approve"
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFinding(finding);
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded flex items-center space-x-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Investigate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side Drawer Modal */}
      <FindingDrawer
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
        onResolve={(id, note) => {
          ctx.resolveFinding(id, note);
          setSelectedFinding(null);
        }}
      />
    </div>
  );
}
