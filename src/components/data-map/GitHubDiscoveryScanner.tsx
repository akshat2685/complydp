"use client";

import React, { useState } from "react";
import {
  GitBranch,
  RefreshCw,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useComplyDP } from "@/context/AppContext";
import { PersonalDataField } from "@/types";

export function GitHubDiscoveryScanner() {
  const ctx = useComplyDP();
  const [selectedRepo, setSelectedRepo] = useState("asterpay/core-checkout");

  const unmappedFields = ctx.personalDataFields.filter(
    (f) => f.status === "Unmapped (AI Suggested)"
  );
  const mappedFields = ctx.personalDataFields.filter((f) => f.status === "Mapped");

  return (
    <div className="space-y-4">
      {/* Scanner Control Bar */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 rounded border border-indigo-200 text-indigo-700">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 flex items-center space-x-2">
              <span>Connected Repository:</span>
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {selectedRepo} (branch: main)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              AST Static Parser inspecting schemas, controllers, and database models for Indian personal data.
            </p>
          </div>
        </div>

        <button
          onClick={ctx.triggerGitHubScan}
          disabled={ctx.gitHubScanInProgress}
          className="px-3.5 py-1.5 font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-subtle flex items-center space-x-1.5 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${ctx.gitHubScanInProgress ? "animate-spin" : ""}`}
          />
          <span>
            {ctx.gitHubScanInProgress ? "Analyzing AST Nodes..." : "Scan Repository"}
          </span>
        </button>
      </div>

      {/* Unmapped Tokens Requiring Human Approval */}
      {unmappedFields.length > 0 && (
        <div className="border border-amber-200 bg-amber-50/40 rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span className="font-semibold text-amber-900 text-xs">
                AI Discovery Suggestions — {unmappedFields.length} Unmapped Tokens Detected
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              AI Suggestion → Human Review → RoPA Inclusion
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unmappedFields.map((field) => (
              <div
                key={field.id}
                className="bg-white border border-amber-200/80 rounded p-3 text-xs space-y-2 shadow-subtle"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="font-bold text-slate-900">{field.fieldName}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700">
                      {field.category}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                    Confidence: {field.confidence}%
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-2">
                  <FileCode className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {field.sourceFile}:{field.sourceLine}
                  </span>
                </div>

                {/* AI Suggested Processing Activity Mapping */}
                <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px] space-y-1">
                  <div className="text-slate-500 font-mono text-[10px]">
                    SUGGESTED PROCESSING ACTIVITY:
                  </div>
                  <div className="font-semibold text-slate-800 flex items-center justify-between">
                    <span>Customer Onboarding & KYC (act_01)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Legal Basis: RBI/DPDP</span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <button
                    onClick={() => ctx.approveFieldMapping(field.id, "act_01")}
                    className="px-3 py-1 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded shadow-subtle flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Approve Mapping to RoPA</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mapped / Approved Inventory */}
      <div className="border border-slate-200 bg-white rounded-sm shadow-subtle overflow-hidden">
        <div className="op-table-header px-4 py-2 flex items-center justify-between">
          <span className="font-semibold text-slate-800">
            Approved Personal Data Field Inventory ({mappedFields.length} active)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Audited Baselines</span>
        </div>
        <table className="w-full text-left text-xs border-collapse font-mono text-[11px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-[10px] uppercase">
              <th className="px-3.5 py-2">Field Token</th>
              <th className="px-3.5 py-2">Data Category</th>
              <th className="px-3.5 py-2">Source Location</th>
              <th className="px-3.5 py-2">Mapped RoPA Activity</th>
              <th className="px-3.5 py-2">Audit Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mappedFields.map((field) => (
              <tr key={field.id} className="hover:bg-slate-50/70">
                <td className="px-3.5 py-2.5 font-bold text-slate-900">{field.fieldName}</td>
                <td className="px-3.5 py-2.5 text-slate-600">{field.category}</td>
                <td className="px-3.5 py-2.5 text-slate-500">
                  {field.sourceRepo} • {field.sourceFile}:{field.sourceLine}
                </td>
                <td className="px-3.5 py-2.5 font-sans font-medium text-blue-700">
                  Customer Onboarding & KYC
                </td>
                <td className="px-3.5 py-2.5">
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                    Approved & Mapped
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
