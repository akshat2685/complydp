"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Users,
  Server,
  FileCheck,
  Send,
  Building,
} from "lucide-react";
import { PrivacyIncident, IncidentObligation } from "@/types";
import { useComplyDP } from "@/context/AppContext";

interface IncidentCommandCenterProps {
  incident: PrivacyIncident;
}

export function IncidentCommandCenter({ incident }: IncidentCommandCenterProps) {
  const ctx = useComplyDP();
  const [activeFilingModal, setActiveFilingModal] = useState<IncidentObligation | null>(null);

  const dpbiObligation = incident.obligations.find((o) =>
    o.authority.includes("Data Protection Board of India")
  );
  const dataPrincipalObligation = incident.obligations.find((o) =>
    o.authority.includes("Affected Data Principals")
  );
  const certInObligation = incident.obligations.find((o) =>
    o.authority.includes("CERT-In")
  );

  const handleUpdateObligation = (obligationId: string, status: "Submitted" | "In Preparation") => {
    ctx.updateIncidentObligation(incident.id, obligationId, status);
  };

  return (
    <div className="space-y-5">
      {/* Incident Header Banner */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-red-100 text-red-800 border border-red-200 rounded">
                {incident.severity} SEVERITY
              </span>
              <span className="font-mono text-xs text-slate-500">{incident.id}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-800 font-mono">
                Status: {incident.status}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">{incident.title}</h2>
          </div>

          <div className="text-right text-xs font-mono text-slate-500 shrink-0">
            <div>
              Detected:{" "}
              {new Date(incident.detectedAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short",
              })}{" "}
              IST
            </div>
            <div className="text-slate-700 font-sans mt-0.5">
              Lead: <span className="font-semibold">{incident.leadInvestigator}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-700 mt-3 leading-relaxed">{incident.summary}</p>
      </div>

      {/* DUAL STATUTORY CLOCKS — CRITICAL REGULATORY DISTINCTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clock 1: DPBI 72-Hour Statutory Board Reporting Clock */}
        <div className="bg-red-50/50 border border-red-200 rounded-sm p-4 shadow-subtle flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-red-900 flex items-center space-x-1.5">
                <Building className="w-4 h-4 text-red-600" />
                <span>Regulatory Board Obligation (DPBI)</span>
              </span>
              <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold border border-red-300">
                Rule 11: 72-Hour Clock
              </span>
            </div>

            <div className="bg-white p-3 rounded border border-red-200 space-y-1">
              <div className="text-xs text-slate-500">Statutory Countdown to DPBI Portal Filing:</div>
              <div className="text-2xl font-mono font-extrabold text-red-700 flex items-center space-x-2">
                <Clock className="w-5 h-5 animate-pulse" />
                <span>{dpbiObligation?.hoursRemaining ?? 51} Hours Remaining</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Deadline: 28 Sep 2026, 18:00 IST (72 hours from confirmation)
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Mandatory formal report to the Data Protection Board of India detailing containment, mitigation, and root cause analysis.
            </p>
          </div>

          <div className="pt-3 border-t border-red-200 flex items-center justify-between mt-3">
            <span className="text-[11px] font-mono text-slate-600">
              Status: <span className="font-semibold text-amber-800">{dpbiObligation?.status}</span>
            </span>
            <button
              onClick={() => handleUpdateObligation(dpbiObligation?.id || "", "Submitted")}
              className="px-3 py-1 text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded shadow-subtle flex items-center space-x-1"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Attest & Submit DPBI Report</span>
            </button>
          </div>
        </div>

        {/* Clock 2: Data Principal Notification ("Without Delay") */}
        <div className="bg-amber-50/50 border border-amber-200 rounded-sm p-4 shadow-subtle flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-amber-900 flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-amber-700" />
                <span>Data Principal Direct Notice</span>
              </span>
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold border border-amber-300">
                DPDP § 8(6): &ldquo;Without Delay&rdquo;
              </span>
            </div>

            <div className="bg-white p-3 rounded border border-amber-200 space-y-1">
              <div className="text-xs text-slate-500">Notice Timing Standard:</div>
              <div className="text-lg font-mono font-bold text-amber-900 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-amber-600" />
                <span>&ldquo;Without Delay&rdquo; Post-Containment</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Scope: 14,200 Indian Data Principals affected
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Section 8(6) requires prompt communication explaining nature of breach, compromised categories, and immediate protective steps taken.
            </p>
          </div>

          <div className="pt-3 border-t border-amber-200 flex items-center justify-between mt-3">
            <span className="text-[11px] font-mono text-slate-600">
              Status:{" "}
              <span className="font-semibold text-amber-800">
                {dataPrincipalObligation?.status}
              </span>
            </span>
            <button
              onClick={() =>
                handleUpdateObligation(dataPrincipalObligation?.id || "", "Submitted")
              }
              className="px-3 py-1 text-xs font-medium text-slate-800 bg-amber-200 hover:bg-amber-300 border border-amber-300 rounded shadow-subtle flex items-center space-x-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Approve & Dispatch Notices</span>
            </button>
          </div>
        </div>
      </div>

      {/* Affected Surface & Forensics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-white border border-slate-200 rounded p-3.5 space-y-1.5 shadow-subtle">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Affected Systems & Assets
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            {incident.affectedSystems.map((sys) => (
              <div key={sys} className="flex items-center text-slate-800">
                <Server className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <span>{sys}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3.5 space-y-1.5 shadow-subtle">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Compromised Data Categories
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            {incident.affectedDataCategories.map((cat) => (
              <div key={cat} className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {cat}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3.5 space-y-1.5 shadow-subtle">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Evidence Provenance Hash
          </div>
          <div className="font-mono text-[10px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 break-all">
            {incident.evidenceHash}
          </div>
          <span className="text-[10px] text-emerald-700 font-mono">
            Forensic snapshot sealed with SHA-256
          </span>
        </div>
      </div>

      {/* Incident Forensic Timeline */}
      <div className="border border-slate-200 bg-white rounded-sm shadow-subtle overflow-hidden">
        <div className="op-table-header px-4 py-2 flex items-center justify-between">
          <span className="font-semibold text-slate-800">Forensic Incident Timeline & Log</span>
          <span className="text-[10px] text-slate-400 font-mono">Append-Only Audit</span>
        </div>
        <div className="p-4 space-y-3 font-mono text-[11px]">
          {incident.timeline.map((item, idx) => (
            <div key={idx} className="flex items-start space-x-3">
              <span className="text-slate-400 shrink-0 w-36">{item.time}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1 shrink-0" />
              <div className="flex-1 font-sans text-xs">
                <span className="text-slate-900 font-medium">{item.event}</span>
                <span className="text-slate-500 font-mono text-[11px] ml-2 font-normal">
                  — by {item.actor}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
