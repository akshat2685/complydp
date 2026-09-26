"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/common/AppShell";
import { GitHubDiscoveryScanner } from "@/components/data-map/GitHubDiscoveryScanner";
import { ProcessingActivityTable } from "@/components/data-map/ProcessingActivityTable";
import { PrivacyGraphView } from "@/components/data-map/PrivacyGraphView";
import { useComplyDP } from "@/context/AppContext";
import {
  Network,
  GitBranch,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function DataMapPage() {
  const ctx = useComplyDP();
  const [activeTab, setActiveTab] = useState<"ropa" | "code" | "graph">("ropa");

  const unmappedCount = ctx.personalDataFields.filter(
    (f) => f.status === "Unmapped (AI Suggested)"
  ).length;

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Data Discovery & Privacy Graph
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-semibold">
                DPDP S.8 Baseline
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Unified operational mapping: source code static discovery, personal data inventory, statutory RoPA, and end-to-end data flow lineage.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 space-x-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab("ropa")}
            className={`pb-2 flex items-center space-x-1.5 transition border-b-2 ${
              activeTab === "ropa"
                ? "border-slate-900 text-slate-900 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Processing Activities (RoPA)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
              {ctx.processingActivities.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("code")}
            className={`pb-2 flex items-center space-x-1.5 transition border-b-2 ${
              activeTab === "code"
                ? "border-slate-900 text-slate-900 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Source Code Discovery (GitHub)</span>
            {unmappedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 border border-amber-200 font-mono font-bold">
                {unmappedCount} Unmapped
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("graph")}
            className={`pb-2 flex items-center space-x-1.5 transition border-b-2 ${
              activeTab === "graph"
                ? "border-slate-900 text-slate-900 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Relational Privacy Graph</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "ropa" && <ProcessingActivityTable />}
        {activeTab === "code" && <GitHubDiscoveryScanner />}
        {activeTab === "graph" && <PrivacyGraphView />}
      </div>
    </AppShell>
  );
}
