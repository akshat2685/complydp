"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/common/AppShell";
import { CookieTrackerTable } from "@/components/consent/CookieTrackerTable";
import { ConsentLedgerView } from "@/components/consent/ConsentLedgerView";
import { useComplyDP } from "@/context/AppContext";
import {
  Globe,
  RefreshCw,
  SlidersHorizontal,
  History,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function ConsentPage() {
  const ctx = useComplyDP();
  const [activeTab, setActiveTab] = useState<"cookies" | "ledger">("cookies");

  const unapprovedTrackers = ctx.webProperty.cookies.filter(
    (c) => c.approvalState === "Needs Review"
  ).length;

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Website Consent & Cookie Intelligence
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold">
                DPDP S.5 & S.6
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Automated crawling of {ctx.webProperty.domain}, tracker classification, pre-consent gap detection, and immutable consent event logging.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={ctx.triggerWebsiteScan}
              disabled={ctx.scanInProgress}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition flex items-center space-x-1.5 shadow-subtle disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-blue-600 ${
                  ctx.scanInProgress ? "animate-spin" : ""
                }`}
              />
              <span>
                {ctx.scanInProgress ? `Scanning (${ctx.scanProgress}%)` : "Run Headless Crawler"}
              </span>
            </button>
          </div>
        </div>

        {/* Web Property Status Strip */}
        <div className="bg-white border border-slate-200 rounded-sm p-3.5 shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900">{ctx.webProperty.domain}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] text-slate-500 font-mono">Status: Active</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Notice: {ctx.webProperty.consentBannerVersion} • Policy: {ctx.webProperty.policyVersion}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">TOTAL COOKIES</span>
              <span className="font-semibold text-slate-800">{ctx.webProperty.cookiesCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">ACTIVE TRACKERS</span>
              <span className="font-semibold text-slate-800">{ctx.webProperty.activeTrackersCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">NEEDS REVIEW</span>
              <span
                className={`font-semibold ${
                  unapprovedTrackers > 0 ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {unapprovedTrackers}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">LAST CRAWL</span>
              <span className="text-slate-700">14:45 IST</span>
            </div>
          </div>
        </div>

        {/* Crawler Progress Bar if active */}
        {ctx.scanInProgress && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs space-y-1.5 animate-in fade-in duration-150">
            <div className="flex justify-between font-mono text-[11px] text-blue-900">
              <span>Scanning asterpay.in/checkout, /pay, /blog...</span>
              <span>{ctx.scanProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${ctx.scanProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 space-x-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab("cookies")}
            className={`pb-2 flex items-center space-x-1.5 transition border-b-2 ${
              activeTab === "cookies"
                ? "border-slate-900 text-slate-900 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Discovered Trackers & Scripts</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
              {ctx.webProperty.cookies.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ledger")}
            className={`pb-2 flex items-center space-x-1.5 transition border-b-2 ${
              activeTab === "ledger"
                ? "border-slate-900 text-slate-900 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Auditable Consent Ledger</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
              Immutable
            </span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "cookies" ? <CookieTrackerTable /> : <ConsentLedgerView />}
      </div>
    </AppShell>
  );
}
