"use client";

import React from "react";
import Link from "next/link";
import {
  Globe,
  GitBranch,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  Database,
} from "lucide-react";
import { useComplyDP } from "@/context/AppContext";

export function SystemStateOverview() {
  const ctx = useComplyDP();

  const unmappedFields = ctx.personalDataFields.filter(
    (f) => f.status === "Unmapped (AI Suggested)"
  ).length;

  const urgentIncident = ctx.incidents.find((i) => i.status !== "Closed");
  const dpbiObligation = urgentIncident?.obligations.find(
    (o) => o.authority.includes("DPBI")
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Website Scanner State */}
      <div className="bg-white border border-slate-200 rounded-sm p-3.5 shadow-subtle flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
            <span className="flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Web Properties</span>
            </span>
            <span className="text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
              Active
            </span>
          </div>
          <div className="mt-2 text-base font-semibold text-slate-900">
            {ctx.webProperty.domain}
          </div>
          <div className="text-[11px] text-slate-600 mt-1 font-mono">
            {ctx.webProperty.cookiesCount} cookies • {ctx.webProperty.activeTrackersCount} trackers
          </div>
        </div>
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Notice v2.1 DPDP</span>
          <Link
            href="/consent"
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            <span>Scan details</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      </div>

      {/* 2. Source Code / Repo Discovery */}
      <div className="bg-white border border-slate-200 rounded-sm p-3.5 shadow-subtle flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
            <span className="flex items-center space-x-1">
              <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
              <span>Code Discovery</span>
            </span>
            <span className="text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
              {unmappedFields} Unmapped
            </span>
          </div>
          <div className="mt-2 text-base font-semibold text-slate-900">
            asterpay/core-checkout
          </div>
          <div className="text-[11px] text-slate-600 mt-1 font-mono">
            Detects phone, email, pan, dob
          </div>
        </div>
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">AST Static Scanner</span>
          <Link
            href="/data-map"
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            <span>Review mappings</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      </div>

      {/* 3. Regulatory DPBI Incident Clock */}
      <div className="bg-white border border-slate-200 rounded-sm p-3.5 shadow-subtle flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
            <span className="flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>DPBI Regulatory Clock</span>
            </span>
            <span className="text-red-700 bg-red-50 px-1 py-0.2 rounded border border-red-200 font-bold">
              {dpbiObligation?.hoursRemaining || 51}h Left
            </span>
          </div>
          <div className="mt-2 text-base font-semibold text-slate-900">
            INC-2026-004
          </div>
          <div className="text-[11px] text-slate-600 mt-1 font-mono">
            14,200 Principals • Phone & PAN
          </div>
        </div>
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">72h S.8(6) Statutory</span>
          <Link
            href="/incidents"
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            <span>Command Center</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      </div>

      {/* 4. Evidence Freshness & Ledger */}
      <div className="bg-white border border-slate-200 rounded-sm p-3.5 shadow-subtle flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Evidence Ledger</span>
            </span>
            <span className="text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 font-mono">
              Verified
            </span>
          </div>
          <div className="mt-2 text-base font-semibold text-slate-900">
            Cryptographic Integrity
          </div>
          <div className="text-[11px] text-slate-600 mt-1 font-mono">
            SHA-256 hashes immutable
          </div>
        </div>
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Tamper-evident logs</span>
          <Link
            href="/evidence"
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            <span>Audit locker</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
