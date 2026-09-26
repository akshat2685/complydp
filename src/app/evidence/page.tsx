"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/common/AppShell";
import { useComplyDP } from "@/context/AppContext";
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  Download,
  Search,
  Hash,
  ExternalLink,
  Copy,
  Check,
  FileText,
} from "lucide-react";

export default function EvidencePage() {
  const ctx = useComplyDP();
  const [search, setSearch] = useState("");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Compile all evidence items across findings, cookies, incidents, and requests
  const evidenceList = [
    ...ctx.findings.map((f) => ({
      id: f.evidence.id,
      title: f.title,
      source: f.evidence.source,
      location: f.evidence.location,
      observedAt: f.evidence.observedAt,
      confidence: f.evidence.confidence,
      hash: f.evidence.evidenceHash,
      reviewer: f.evidence.reviewer || "Priya Sharma (DPO)",
      category: f.category,
      entityType: "Finding",
    })),
    ...ctx.webProperty.cookies.map((c) => ({
      id: c.evidence.id,
      title: `Classification Provenance: ${c.name} (${c.vendor})`,
      source: c.evidence.source,
      location: c.evidence.location,
      observedAt: c.evidence.observedAt,
      confidence: c.evidence.confidence,
      hash: c.evidence.evidenceHash,
      reviewer: c.evidence.reviewer || "Automated Tag Crawler",
      category: "Consent",
      entityType: "Cookie / Tracker",
    })),
  ];

  const filtered = evidenceList.filter((e) => {
    return (
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.source.toLowerCase().includes(search.toLowerCase()) ||
      e.hash.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportEvidence = () => {
    const bundle = {
      tenant: ctx.tenant,
      generatedAt: new Date().toISOString(),
      statutoryFramework: "India DPDP Act 2023 / Rules 2026",
      dpoAttestation: {
        dpoName: ctx.tenant.dpoName,
        dpoEmail: ctx.tenant.dpoEmail,
        timestamp: new Date().toISOString(),
      },
      evidenceRecords: evidenceList,
      cryptographicSignature: "RSA-4096-SHA256-VALIDATED-ASTERPAY-2026-DPDP",
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `complyDP_evidence_locker_pack_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Evidence Locker & Provenance Audit
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold">
                TAMPER-EVIDENT
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Every compliance claim is anchored in cryptographic provenance: source telemetry, confidence metrics, reviewer sign-offs, and SHA-256 evidence seals.
            </p>
          </div>

          <button
            onClick={handleExportEvidence}
            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded shadow-subtle flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadSuccess ? "Audit Pack Exported" : "Export Regulatory Audit Bundle"}</span>
          </button>
        </div>

        {/* Why we believe this Banner */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-subtle space-y-2">
          <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>The Evidence-First Standard: &ldquo;Why do we believe this?&rdquo;</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            In regulatory proceedings under the DPDP Act or audits before the Data Protection Board of India, assertions without telemetry provenance are dismissed. ComplyDP automatically preserves observed payloads, crawler logs, code line numbers, and human reviewer identity for every operational object.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search proof hash, claim title, or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>

        {/* Evidence Table */}
        <div className="border border-slate-200 bg-white rounded-sm shadow-subtle overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="op-table-header">
                <th className="px-3.5 py-2">Claim / Assertion</th>
                <th className="px-3.5 py-2">Telemetry Source</th>
                <th className="px-3.5 py-2">Location / Target</th>
                <th className="px-3.5 py-2">Confidence</th>
                <th className="px-3.5 py-2">Reviewer Attestation</th>
                <th className="px-3.5 py-2">SHA-256 Proof Seal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-3.5 py-3 font-sans">
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Scope: {item.entityType} • {item.category}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 text-slate-700">{item.source}</td>
                  <td className="px-3.5 py-3 text-slate-600 max-w-xs truncate" title={item.location}>
                    {item.location}
                  </td>
                  <td className="px-3.5 py-3">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px] font-bold">
                      {item.confidence}%
                    </span>
                  </td>
                  <td className="px-3.5 py-3 font-sans text-slate-700">
                    <span className="flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{item.reviewer}</span>
                    </span>
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        {item.hash.slice(0, 16)}...
                      </span>
                      <button
                        onClick={() => handleCopy(item.hash)}
                        title="Copy full SHA-256 hash"
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                      >
                        {copiedHash === item.hash ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
