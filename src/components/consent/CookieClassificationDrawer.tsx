"use client";

import React, { useState } from "react";
import { X, ShieldCheck, AlertCircle, FileCode, CheckCircle2, Hash, Clock, Globe } from "lucide-react";
import { DiscoveredCookie, CookieCategory } from "@/types";

interface CookieClassificationDrawerProps {
  cookie: DiscoveredCookie | null;
  onClose: () => void;
  onApprove: (cookieId: string, newCategory: CookieCategory) => void;
}

export function CookieClassificationDrawer({
  cookie,
  onClose,
  onApprove,
}: CookieClassificationDrawerProps) {
  const [selectedCategory, setSelectedCategory] = useState<CookieCategory>(
    cookie?.category || "Unknown"
  );

  if (!cookie) return null;

  const categories: CookieCategory[] = [
    "Necessary",
    "Analytics",
    "Functional",
    "Advertising",
    "Unknown",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white h-full shadow-drawer flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 border border-slate-300 rounded">
              {cookie.name}
            </span>
            <span className="text-xs text-slate-500 font-mono">{cookie.domain}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
          {/* Tracker Profile */}
          <div className="border border-slate-200 rounded p-3.5 space-y-2 bg-slate-50/50">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Tracker Identification
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Vendor:</span>
                <span className="font-semibold text-slate-900">{cookie.vendor}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Consent Required:</span>
                <span
                  className={`inline-block font-mono text-[11px] font-semibold ${
                    cookie.consentRequired ? "text-amber-700" : "text-emerald-700"
                  }`}
                >
                  {cookie.consentRequired ? "YES (Affirmative Opt-in)" : "NO (Exempt Strictly Necessary)"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Observed Purpose:</span>
                <span className="text-slate-800">{cookie.purpose}</span>
              </div>
            </div>
          </div>

          {/* Script Execution Origin */}
          <div className="border border-slate-200 rounded p-3.5 space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Script Source & Execution Trace</span>
              {cookie.observedBeforeConsent && (
                <span className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.2 rounded font-mono text-[10px]">
                  Consent Gap: Pre-Consent Execution
                </span>
              )}
            </div>
            <div className="bg-slate-900 text-slate-100 p-2.5 rounded font-mono text-[11px] break-all">
              {cookie.scriptSource}
            </div>
            {cookie.observedBeforeConsent && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                Warning: This script initialized before the visitor clicked &apos;Accept&apos; on the DPDP Section 5 banner.
              </p>
            )}
          </div>

          {/* Human Classification & Override */}
          <div className="border border-slate-200 rounded p-3.5 space-y-3 bg-white">
            <label className="block text-[11px] font-semibold text-slate-800 uppercase tracking-wider">
              Classification Category (DPDP Schedule)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`p-2 text-left rounded border text-xs font-medium transition flex items-center justify-between ${
                    selectedCategory === cat
                      ? "border-blue-600 bg-blue-50/60 text-blue-900 ring-1 ring-blue-600"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Note: Changing to Necessary removes affirmative consent enforcement. Requires justification in RoPA.
            </p>
          </div>

          {/* Evidence Details */}
          <div className="border border-slate-200 rounded p-3.5 space-y-2 bg-slate-50/70 font-mono text-[11px]">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Classification Evidence Record
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Observed Location:</span>
              <span className="text-slate-800">{cookie.evidence.location}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Evidence Hash:</span>
              <span className="text-slate-600 break-all text-[10px] bg-white p-1 rounded border border-slate-200 block">
                {cookie.evidence.evidenceHash}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded bg-white hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApprove(cookie.id, selectedCategory);
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-subtle flex items-center space-x-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Approve Classification & Update RoPA</span>
          </button>
        </div>
      </div>
    </div>
  );
}
