"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/common/AppShell";
import { AttentionQueue } from "@/components/control-room/AttentionQueue";
import { SystemStateOverview } from "@/components/control-room/SystemStateOverview";
import { RecentActivityFeed } from "@/components/control-room/RecentActivityFeed";
import { useComplyDP } from "@/context/AppContext";
import {
  Globe,
  GitBranch,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";

export default function OverviewPage() {
  const ctx = useComplyDP();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExportEvidence = () => {
    const bundle = {
      tenant: ctx.tenant,
      generatedAt: new Date().toISOString(),
      framework: "DPDP Act 2023 / Rules 2026",
      webProperty: ctx.webProperty,
      findingsSummary: {
        total: ctx.findings.length,
        unresolved: ctx.findings.filter((f) => f.status === "Needs Review").length,
      },
      consentAuditSample: ctx.consentEvents.slice(0, 5),
      incidents: ctx.incidents,
      processingActivities: ctx.processingActivities,
      auditSignature: "SHA256_RSA4096_VALIDATED_ASTERPAY_2026",
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `complyDP_audit_bundle_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Privacy Control Room
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold">
                SENSORS ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Continuous discovery, classification, consent tracking, and regulatory obligation enforcement under the DPDP Act.
            </p>
          </div>

          {/* Quick Actions */}
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
                {ctx.scanInProgress ? `Crawling (${ctx.scanProgress}%)` : "Scan asterpay.in"}
              </span>
            </button>

            <button
              onClick={handleExportEvidence}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition flex items-center space-x-1.5 shadow-subtle"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>{downloadSuccess ? "Audit Pack Exported" : "Export Evidence Pack"}</span>
            </button>
          </div>
        </div>

        {/* Operational Sensors Overview */}
        <section>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 font-mono">
            System State & Sensor Telemetry
          </div>
          <SystemStateOverview />
        </section>

        {/* Attention Queue (Answers: "What needs attention right now?") */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Attention Queue — Unresolved Findings
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Human-in-the-Loop Operational Review
            </span>
          </div>
          <AttentionQueue />
        </section>

        {/* Activity Feed */}
        <section>
          <RecentActivityFeed />
        </section>
      </div>
    </AppShell>
  );
}
