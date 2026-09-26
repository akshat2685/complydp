"use client";

import React, { useState } from "react";
import { X, ShieldCheck, AlertCircle, FileCode, CheckCircle, ExternalLink, Hash, Clock, User } from "lucide-react";
import { Finding } from "@/types";

interface FindingDrawerProps {
  finding: Finding | null;
  onClose: () => void;
  onResolve: (id: string, note?: string) => void;
}

export function FindingDrawer({ finding, onClose, onResolve }: FindingDrawerProps) {
  const [resolutionNote, setResolutionNote] = useState("");

  if (!finding) return null;

  const handleApprove = () => {
    onResolve(finding.id, resolutionNote || "Approved and applied to privacy operations baseline.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white h-full shadow-drawer flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded ${
                finding.severity === "Critical"
                  ? "bg-red-100 text-red-800 border border-red-200"
                  : finding.severity === "High"
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
            >
              {finding.severity}
            </span>
            <span className="font-mono text-xs text-slate-500">{finding.type}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
          {/* Title & Status */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 leading-snug">{finding.title}</h2>
            <div className="flex items-center space-x-4 mt-2 text-[11px] text-slate-500 font-mono">
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Detected: {new Date(finding.detectedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
              </span>
              <span>Source: {finding.source}</span>
            </div>
          </div>

          {/* Operational Context: Why it matters */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-sm p-3.5 space-y-1">
            <div className="font-semibold text-amber-900 text-[11px] uppercase tracking-wider flex items-center">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
              Why this matters
            </div>
            <p className="text-slate-800 leading-relaxed">{finding.whyItMatters}</p>
          </div>

          {/* Suggested Operational Action */}
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-3.5 space-y-1">
            <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider flex items-center">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Recommended Operational Action
            </div>
            <p className="text-slate-800 leading-relaxed">{finding.suggestedAction}</p>
          </div>

          {/* Evidence Ledger Provenance */}
          <div className="border border-slate-200 rounded-sm overflow-hidden">
            <div className="bg-slate-100/80 px-3.5 py-2 font-semibold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-200 flex items-center justify-between">
              <span>Evidence Provenance</span>
              <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Confidence: {finding.evidence.confidence}%
              </span>
            </div>
            <div className="p-3.5 space-y-2.5 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Telemetry Source:</span>
                <span className="text-slate-800 font-semibold">{finding.evidence.source}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Location / Target:</span>
                <span className="text-slate-800 break-all">{finding.evidence.location}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Evidence SHA-256 Hash:</span>
                <span className="text-slate-600 break-all text-[10px] bg-slate-50 p-1 block rounded border border-slate-200">
                  {finding.evidence.evidenceHash}
                </span>
              </div>

              {finding.evidence.rawPayload && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Telemetry Payload:</span>
                  <pre className="bg-slate-900 text-slate-100 p-2 rounded text-[10px] overflow-x-auto">
                    {JSON.stringify(finding.evidence.rawPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Review / Sign-off section */}
          <div className="border border-slate-200 rounded-sm p-3.5 space-y-2 bg-slate-50/50">
            <label className="block text-[11px] font-semibold text-slate-800 uppercase tracking-wider">
              DPO / Lead Reviewer Sign-off Note
            </label>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Verified tag manager deferral rule; classification approved for AsterPay checkout."
              rows={2}
              className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded bg-white hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-subtle flex items-center space-x-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Approve & Apply to Operations</span>
          </button>
        </div>
      </div>
    </div>
  );
}
