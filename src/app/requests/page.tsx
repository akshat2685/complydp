"use client";

import React from "react";
import { AppShell } from "@/components/common/AppShell";
import { RequestsTable } from "@/components/requests/RequestsTable";
import { useComplyDP } from "@/context/AppContext";
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export default function RequestsPage() {
  const ctx = useComplyDP();

  const activeCases = ctx.requests.filter(
    (r) => r.status !== "Completed" && r.status !== "Rejected"
  ).length;

  const slaRisks = ctx.requests.filter(
    (r) => r.daysRemaining <= 2 && r.status !== "Completed"
  ).length;

  const completed = ctx.requests.filter((r) => r.status === "Completed").length;

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Data Principal Rights Portal
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold">
                DPDP § 11, 12 & 13
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Operational case-management system for handling rights requests: Erasure, Access / Portability, Rectification, and Processor Disclosures.
            </p>
          </div>
        </div>

        {/* Operational Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded p-3.5 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-mono">ACTIVE CASES</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{activeCases} pending</div>
            </div>
            <div className="p-2 bg-blue-50 rounded border border-blue-200 text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-3.5 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-mono">SLA DEADLINE RISKS</span>
              <div className="text-lg font-bold text-amber-700 mt-0.5">
                {slaRisks} approaching deadline
              </div>
            </div>
            <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-3.5 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-mono">COMPLETED & AUDITED</span>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">{completed} resolved</div>
            </div>
            <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <RequestsTable />
      </div>
    </AppShell>
  );
}
