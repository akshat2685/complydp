"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Database,
  Layers,
  ShieldCheck,
  Building2,
  FileCheck,
  Server,
  Lock,
} from "lucide-react";
import { useComplyDP } from "@/context/AppContext";

export function PrivacyGraphView() {
  const ctx = useComplyDP();
  const [selectedChain, setSelectedChain] = useState<string>("phone");

  const chains = [
    {
      id: "phone",
      label: "Customer Phone Flow",
      dataElement: "customer_phone",
      dataCategory: "Contact Information",
      processingActivity: "Customer Onboarding & KYC",
      purpose: "Identity Verification & Fraud Prevention (RBI / DPDP)",
      system: "asterpay-core-db",
      vendor: "Razorpay (Payment Gateway)",
      control: "AES-256 Field Encryption + OTP Verification",
      evidenceHash: "9900aabbccddeeff00112233445566778899aabbccddeeff0011223344556677",
    },
    {
      id: "segment",
      label: "Checkout Funnel Telemetry",
      dataElement: "ajs_anonymous_id",
      dataCategory: "Device Telemetry & Analytics",
      processingActivity: "Product Analytics & Funnel Optimization",
      purpose: "Drop-off Rate Measurement on Checkout",
      system: "checkout-web-frontend",
      vendor: "Segment (Twilio Inc.)",
      control: "Consent Gated (Deferred until Consent Granted)",
      evidenceHash: "b8a91c2049e81726354901827364519283746519283746519283746519283746",
    },
    {
      id: "pan",
      label: "Tax & Financial Identity Flow",
      dataElement: "pan_number",
      dataCategory: "Government Identifier",
      processingActivity: "Customer Onboarding & KYC",
      purpose: "Statutory Tax & AML Compliance under PMLA",
      system: "kyc-vault-isolated",
      vendor: "Signzy KYC Gateway",
      control: "HSM Hardware Tokenization + Masked Storage",
      evidenceHash: "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
    },
  ];

  const current = chains.find((c) => c.id === selectedChain) || chains[0];

  return (
    <div className="space-y-4">
      {/* Selector pills */}
      <div className="flex items-center space-x-2">
        <span className="text-[11px] font-mono text-slate-500 uppercase">Contextual Graph Trace:</span>
        {chains.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedChain(c.id)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition ${
              selectedChain === c.id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Visual Graph Chain View */}
      <div className="border border-slate-200 bg-white rounded-sm p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="text-xs font-semibold text-slate-900">
            Privacy Graph Relationship Model
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Data → Category → Activity → Purpose → System → Vendor → Control → Evidence
          </span>
        </div>

        {/* Node Flow Representation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Node 1: Personal Data Element */}
          <div className="border border-blue-200 bg-blue-50/40 rounded p-3 space-y-1.5">
            <div className="text-[10px] font-mono uppercase text-blue-700 font-bold flex items-center justify-between">
              <span>1. Data Token</span>
              <Database className="w-3.5 h-3.5" />
            </div>
            <div className="font-mono font-bold text-slate-900 text-xs">
              {current.dataElement}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Category: <span className="text-slate-800">{current.dataCategory}</span>
            </div>
          </div>

          {/* Node 2: Processing Activity & Purpose */}
          <div className="border border-indigo-200 bg-indigo-50/40 rounded p-3 space-y-1.5">
            <div className="text-[10px] font-mono uppercase text-indigo-700 font-bold flex items-center justify-between">
              <span>2. RoPA Activity</span>
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="font-semibold text-slate-900 text-xs leading-snug">
              {current.processingActivity}
            </div>
            <div className="text-[10px] text-slate-600 leading-tight">
              Purpose: {current.purpose}
            </div>
          </div>

          {/* Node 3: System & Vendor */}
          <div className="border border-emerald-200 bg-emerald-50/40 rounded p-3 space-y-1.5">
            <div className="text-[10px] font-mono uppercase text-emerald-700 font-bold flex items-center justify-between">
              <span>3. Asset & Processor</span>
              <Server className="w-3.5 h-3.5" />
            </div>
            <div className="font-mono font-bold text-slate-900 text-xs">
              {current.system}
            </div>
            <div className="text-[10px] text-slate-600">
              Vendor: <span className="font-semibold">{current.vendor}</span>
            </div>
          </div>

          {/* Node 4: Control & Evidence Provenance */}
          <div className="border border-slate-200 bg-slate-50 rounded p-3 space-y-1.5 font-mono text-[10px]">
            <div className="text-[10px] font-mono uppercase text-slate-700 font-bold flex items-center justify-between">
              <span>4. Control & Proof</span>
              <Lock className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <div className="text-slate-800 font-sans font-medium">
              {current.control}
            </div>
            <div className="text-slate-400 break-all text-[9px] bg-white p-1 rounded border border-slate-200">
              Proof: {current.evidenceHash.slice(0, 20)}...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
