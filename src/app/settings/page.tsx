"use client";

import React from "react";
import { AppShell } from "@/components/common/AppShell";
import { useComplyDP } from "@/context/AppContext";
import {
  Settings,
  Scale,
  ShieldCheck,
  Building,
  User,
  Clock,
  Layers,
  FileText,
} from "lucide-react";

export default function SettingsPage() {
  const ctx = useComplyDP();

  const regulatoryRules = [
    {
      id: "reg_01",
      regulation: "Digital Personal Data Protection Act, 2023",
      section: "Section 5 & Rule 4",
      obligation: "Multi-lingual Notice & Granular Consent Specification",
      category: "Legal Requirement",
      version: "v2026.04",
      trigger: "Visitor arrives on any digital property collecting personal data",
      deadline: "Prior to or at the time of collecting personal data",
      action: "Display consent banner with English + 22 Scheduled language toggles",
    },
    {
      id: "reg_02",
      regulation: "Digital Personal Data Protection Act, 2023",
      section: "Section 6(1)",
      obligation: "Affirmative Consent for Non-Essential Trackers",
      category: "Legal Requirement",
      version: "v2026.04",
      trigger: "Analytics or Advertising scripts detected in web bundle",
      deadline: "Immediate (Zero pre-consent tracker execution)",
      action: "Block tracking scripts until explicit consent_granted event is recorded",
    },
    {
      id: "reg_03",
      regulation: "DPDP Rules Framework, 2026",
      section: "Rule 11 (Breach Notification)",
      obligation: "Formal Incident Report to Data Protection Board of India (DPBI)",
      category: "Legal Requirement",
      version: "v2026.01",
      trigger: "Personal data breach confirmed impacting Indian Data Principals",
      deadline: "Strict 72-Hour Statutory Clock",
      action: "Submit forensic containment, affected categories, and mitigation audit to DPBI portal",
    },
    {
      id: "reg_04",
      regulation: "Digital Personal Data Protection Act, 2023",
      section: "Section 8(6)",
      obligation: "Direct Breach Notification to Affected Data Principals",
      category: "Legal Requirement",
      version: "v2026.01",
      trigger: "Risk assessment indicates plausible harm or unauthorized disclosure",
      deadline: "Without Delay post-containment",
      action: "Send direct SMS/Email advisory with DPO grievance contact info",
    },
    {
      id: "reg_05",
      regulation: "ComplyDP Internal Operational Baseline",
      section: "Policy G-04",
      obligation: "Data Principal Request SLA Target",
      category: "User-Entered Policy",
      version: "v3.2",
      trigger: "Erasure or Access request submitted via portal",
      deadline: "Internal 10-day target (Statutory max: 30 days)",
      action: "Execute cryptographic erasure and deliver resolution receipt",
    },
    {
      id: "reg_06",
      regulation: "ComplyDP AI Inference Model",
      section: "Model IN-PII-v2",
      obligation: "Automated Sensitive Field Detection (PAN / Aadhaar)",
      category: "AI Inference",
      version: "v2.8.4",
      trigger: "Static code scan or schema commit in GitHub repositories",
      deadline: "Continuous CI/CD hook",
      action: "Flag unmapped tokens for human DPO sign-off and RoPA inclusion",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Regulatory Model & Tenant Governance
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold">
                CONFIGURABLE ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Configurable regulatory rules under India DPDP Act 2023 and DPDP Rules 2026. Distinguishes statutory requirements, product recommendations, AI inferences, and tenant policies.
            </p>
          </div>
        </div>

        {/* Tenant Configuration Card */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-subtle space-y-3">
          <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono flex items-center space-x-1.5">
            <Building className="w-4 h-4 text-slate-600" />
            <span>Organization & DPO Profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Data Fiduciary:</span>
              <span className="font-bold text-slate-900">{ctx.tenant.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Data Protection Officer:</span>
              <span className="font-semibold text-slate-900">{ctx.tenant.dpoName}</span>
              <span className="text-[10px] text-slate-500 block font-normal">{ctx.tenant.dpoEmail}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Applicable Law:</span>
              <span className="text-slate-800 font-sans text-xs">{ctx.tenant.regulatoryFramework}</span>
            </div>
          </div>
        </div>

        {/* Versioned Regulatory Obligations Table */}
        <div className="border border-slate-200 bg-white rounded-sm shadow-subtle overflow-hidden">
          <div className="op-table-header px-4 py-2 flex items-center justify-between">
            <span className="font-semibold text-slate-800">
              Versioned Regulatory Obligation Catalog (No Hardcoded Legal Assumptions)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">India DPDP Framework</span>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-[10px] uppercase font-mono">
                <th className="px-3.5 py-2">Obligation & Section</th>
                <th className="px-3.5 py-2">Standard Category</th>
                <th className="px-3.5 py-2">Trigger Event</th>
                <th className="px-3.5 py-2">Statutory Deadline</th>
                <th className="px-3.5 py-2">Operational Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {regulatoryRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-3.5 py-3 font-sans">
                    <div className="font-semibold text-slate-900">{rule.obligation}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {rule.regulation} • {rule.section} ({rule.version})
                    </div>
                  </td>
                  <td className="px-3.5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        rule.category === "Legal Requirement"
                          ? "bg-red-50 text-red-800 border border-red-200"
                          : rule.category === "AI Inference"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {rule.category}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-slate-600 font-sans text-xs">
                    {rule.trigger}
                  </td>
                  <td className="px-3.5 py-3 text-slate-900 font-bold">
                    {rule.deadline}
                  </td>
                  <td className="px-3.5 py-3 text-slate-700 font-sans text-xs max-w-xs">
                    {rule.action}
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
