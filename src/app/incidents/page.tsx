"use client";

import React from "react";
import { AppShell } from "@/components/common/AppShell";
import { IncidentCommandCenter } from "@/components/incidents/IncidentCommandCenter";
import { useComplyDP } from "@/context/AppContext";
import { AlertTriangle, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function IncidentsPage() {
  const ctx = useComplyDP();
  const activeIncident = ctx.incidents[0]; // INC-2026-004

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Privacy Incident & Breach Command Center
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-red-50 text-red-700 border border-red-200 rounded font-semibold">
                DPDP S.8(6) & Rules 2026
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Triage, blast radius evaluation, containment audit, and strict statutory dual-clock enforcement (DPBI 72-hour board reporting vs. direct principal notification).
            </p>
          </div>
        </div>

        {/* Command Center */}
        {activeIncident ? (
          <IncidentCommandCenter incident={activeIncident} />
        ) : (
          <div className="p-8 text-center bg-white border border-slate-200 rounded text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="font-semibold text-slate-800">No Active Privacy Incidents</div>
            <div>All systems within security & privacy operational baselines.</div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
