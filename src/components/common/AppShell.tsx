import React from "react";
import Link from "next/link";
import { db } from "@/server/db";
import { Seal } from "@/components/ui";
import { NavLinks } from "./NavLinks";

function getCounts() {
  const d = db();
  const q = (sql: string) => (d.prepare(sql).get() as { n: number }).n;
  return {
    findings: q("SELECT COUNT(*) AS n FROM findings WHERE status = 'needs_review'"),
    consent: q("SELECT COUNT(*) AS n FROM findings WHERE status = 'needs_review' AND category = 'consent'"),
    dsr: q("SELECT COUNT(*) AS n FROM dsr_cases WHERE status IN ('new','in_progress','waiting')"),
    breach: q("SELECT COUNT(*) AS n FROM breach_cases WHERE status = 'open'"),
    unmapped: q("SELECT COUNT(*) AS n FROM data_fields WHERE mapped_activity_id = '' AND pii_category != 'none'"),
    vendors: q("SELECT COUNT(*) AS n FROM vendors WHERE dpa_status IN ('not_started','under_review')"),
  };
}

function getTenant() {
  const d = db();
  const t = d.prepare("SELECT name, domain, dpo_name FROM tenant WHERE id = 'tenant_meridian'").get() as {
    name: string; domain: string; dpo_name: string;
  };
  return t;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const counts = getCounts();
  const tenant = getTenant();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[248px] shrink-0 border-r border-hairline-strong bg-paper-panel flex flex-col fixed inset-y-0 z-30">
        <div className="px-4 pt-5 pb-4 border-b border-hairline">
          <Link href="/" className="flex items-center gap-2.5">
            <Seal size={34} />
            <div>
              <div className="font-display text-[19px] font-bold tracking-tight text-ink leading-none">
                Pramaan
              </div>
              <div className="kicker mt-1" style={{ fontSize: 9 }}>
                Privacy Evidence Registry
              </div>
            </div>
          </Link>
        </div>

        <div className="px-4 py-3 border-b border-hairline bg-paper">
          <div className="kicker mb-1" style={{ fontSize: 9 }}>
            Tenant
          </div>
          <div className="text-[12.5px] font-bold text-ink truncate">{tenant.name}</div>
          <div className="text-[11px] text-ink-muted font-mono truncate">
            {tenant.domain} · {tenant.dpo_name}
          </div>
        </div>

        <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
          <NavLinks counts={counts} />
        </nav>

        <div className="px-4 py-3 border-t border-hairline">
          <div className="flex items-center gap-2 text-[11px] text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
            <span className="font-mono">Ledger: SQLite · SHA-256 chained</span>
          </div>
          <Link
            href="/settings"
            className="mt-2 inline-block text-[11px] font-semibold text-ink-muted hover:text-ink underline underline-offset-2"
          >
            Reset demo data
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="pl-[248px] flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-hairline-strong bg-paper-panel/90 backdrop-blur sticky top-0 z-20 flex items-center px-6">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="font-bold text-ink">{tenant.name}</span>
            <span className="text-hairline-strong">/</span>
            <span className="text-ink-muted">DPDP Act, 2023</span>
            <span className="text-hairline-strong">/</span>
            <span className="font-mono text-[11px] text-ink-faint">
              {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </header>
        <main className="flex-1 px-6 py-6 w-full max-w-[1200px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
