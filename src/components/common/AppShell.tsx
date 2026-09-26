"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  SlidersHorizontal,
  FileText,
  AlertTriangle,
  Network,
  Building2,
  Lock,
  Settings,
  ChevronRight,
  RefreshCw,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useComplyDP } from "@/context/AppContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: (ctx: ReturnType<typeof useComplyDP>) => number;
}

const navItems: NavItem[] = [
  {
    name: "Overview",
    href: "/",
    icon: ShieldAlert,
    badgeCount: (ctx) => ctx.findings.filter((f) => f.status === "Needs Review").length,
  },
  {
    name: "Consent",
    href: "/consent",
    icon: SlidersHorizontal,
    badgeCount: (ctx) =>
      ctx.findings.filter((f) => f.category === "Consent" && f.status === "Needs Review").length,
  },
  {
    name: "Requests",
    href: "/requests",
    icon: FileText,
    badgeCount: (ctx) =>
      ctx.requests.filter((r) => r.status === "In Progress" || r.status === "Waiting").length,
  },
  {
    name: "Incidents",
    href: "/incidents",
    icon: AlertTriangle,
    badgeCount: (ctx) =>
      ctx.incidents.filter((i) => i.status !== "Closed" && i.status !== "Remediated").length,
  },
  {
    name: "Data Map",
    href: "/data-map",
    icon: Network,
    badgeCount: (ctx) =>
      ctx.personalDataFields.filter((f) => f.status === "Unmapped (AI Suggested)").length,
  },
  {
    name: "Vendors",
    href: "/vendors",
    icon: Building2,
    badgeCount: (ctx) => ctx.vendors.filter((v) => v.dpaStatus === "Under Review").length,
  },
  {
    name: "Evidence",
    href: "/evidence",
    icon: Lock,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ctx = useComplyDP();
  const [showDemoGuide, setShowDemoGuide] = useState(false);

  const pendingFindings = ctx.findings.filter((f) => f.status === "Needs Review").length;

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] text-[#0f172a]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#e2e8f0] bg-white flex flex-col fixed inset-y-0 z-30">
        {/* Brand Header */}
        <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs rounded-sm">
                DP
              </div>
              <span className="font-semibold text-sm tracking-tight text-[#0f172a]">
                complyDP
              </span>
            </div>
            <div className="text-[10px] text-[#64748b] uppercase tracking-wider font-mono mt-0.5">
              Privacy Ops Center (India)
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded">
            DPDP 2026
          </span>
        </div>

        {/* Organization Badge */}
        <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] text-xs">
          <div className="text-[11px] text-[#64748b] font-medium">Tenant Property</div>
          <div className="font-semibold text-[#0f172a] truncate">{ctx.tenant.name}</div>
          <div className="text-[10px] text-[#475569] font-mono flex items-center mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            {ctx.webProperty.domain} • DPO: {ctx.tenant.dpoName}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const count = item.badgeCount ? item.badgeCount(ctx) : 0;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-sm transition-colors ${
                  isActive
                    ? "bg-[#0f172a] text-white"
                    : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#64748b]"}`} />
                  <span>{item.name}</span>
                </div>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? "bg-amber-400 text-slate-900"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Guided Demo Walkthrough Box */}
        <div className="p-3 border-t border-[#e2e8f0] bg-[#fafafa]">
          <button
            onClick={() => setShowDemoGuide(!showDemoGuide)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition"
          >
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Demo Walkthrough</span>
            </span>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform ${showDemoGuide ? "rotate-90" : ""}`}
            />
          </button>

          {showDemoGuide && (
            <div className="mt-2 p-2.5 text-[11px] bg-white border border-slate-200 rounded shadow-subtle space-y-1.5 text-slate-600">
              <div className="font-semibold text-slate-800 flex items-center justify-between">
                <span>AsterPay Demo Story</span>
                <button
                  onClick={ctx.resetToDemo}
                  title="Reset Demo State"
                  className="text-slate-400 hover:text-slate-700"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <ol className="list-decimal pl-3 space-y-1 text-[10px] leading-tight">
                <li>Check Overview: 12 findings in attention queue.</li>
                <li>Go to Consent: review Segment tracker gap on checkout.</li>
                <li>Approve classification: updates Data Map automatically.</li>
                <li>Go to Data Map: run GitHub scan on core-checkout.</li>
                <li>Approve phone/PAN mapping to KYC Onboarding.</li>
                <li>View Incidents: observe DPBI 72h statutory clock.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer State */}
        <div className="p-3 border-t border-[#e2e8f0] text-[10px] text-[#64748b] flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Continuous Monitoring</span>
          </span>
          <button
            onClick={ctx.resetToDemo}
            className="text-[10px] text-slate-500 hover:text-slate-900 underline font-mono"
          >
            Reset
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Control Bar */}
        <header className="h-12 border-b border-[#e2e8f0] bg-white sticky top-0 z-20 flex items-center justify-between px-6">
          <div className="flex items-center space-x-3 text-xs">
            <span className="font-semibold text-slate-900">
              AsterPay Technologies Pvt. Ltd.
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Privacy Control Plane</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 font-mono text-[11px]">
              DPDP Act 2023 § 4-11
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {pendingFindings > 0 && (
              <Link
                href="/"
                className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 rounded-sm hover:bg-amber-100 transition"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>{pendingFindings} items require review</span>
              </Link>
            )}

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center space-x-2 text-[11px] text-slate-600 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Sensor Scan: Active</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
