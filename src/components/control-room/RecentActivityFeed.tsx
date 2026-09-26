"use client";

import React from "react";
import { Clock, ShieldAlert, CheckCircle2, GitCommit, FileText, ArrowRight } from "lucide-react";

export function RecentActivityFeed() {
  const activities = [
    {
      id: "act_1",
      time: "14:45 IST",
      type: "SCAN",
      icon: Clock,
      iconColor: "text-blue-600 bg-blue-50 border-blue-200",
      title: "Website crawler finished scan on asterpay.in/checkout",
      meta: "18 cookies observed • 1 unapproved tracker flagged (Segment)",
    },
    {
      id: "act_2",
      time: "14:15 IST",
      type: "CONSENT",
      icon: CheckCircle2,
      iconColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
      title: "Consent ledger recorded affirmative acceptance",
      meta: "Visitor: anon_sha256_8f3c7a... • Banner Notice v2.1",
    },
    {
      id: "act_3",
      time: "13:12 IST",
      type: "CODE",
      icon: GitCommit,
      iconColor: "text-indigo-600 bg-indigo-50 border-indigo-200",
      title: "Static discovery scanned repository asterpay/core-checkout",
      meta: "4 PII tokens discovered (customer_phone, email, pan, dob)",
    },
    {
      id: "act_4",
      time: "12:00 IST",
      type: "REQUEST",
      icon: FileText,
      iconColor: "text-amber-600 bg-amber-50 border-amber-200",
      title: "SLA risk alert generated for PR-2026-081 (Delete my data)",
      meta: "48 hours remaining under DPDP statutory timeline",
    },
    {
      id: "act_5",
      time: "09:00 IST",
      type: "INCIDENT",
      icon: ShieldAlert,
      iconColor: "text-red-600 bg-red-50 border-red-200",
      title: "Incident INC-2026-004 triage updated to Obligations Determined",
      meta: "14,200 Indian Data Principals scoped • DPBI 72h clock running",
    },
  ];

  return (
    <div className="border border-slate-200 bg-white rounded-sm shadow-subtle overflow-hidden">
      <div className="op-table-header px-4 py-2 flex items-center justify-between">
        <span className="font-semibold text-slate-800">Operational Activity Stream</span>
        <span className="text-[10px] text-slate-400 font-mono">Live Telemetry</span>
      </div>
      <div className="divide-y divide-slate-100 p-2">
        {activities.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="py-2.5 px-3 flex items-start space-x-3 text-xs hover:bg-slate-50/70 transition">
              <div className={`p-1.5 rounded-sm border shrink-0 ${item.iconColor}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 truncate">{item.title}</span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">{item.time}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{item.meta}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
