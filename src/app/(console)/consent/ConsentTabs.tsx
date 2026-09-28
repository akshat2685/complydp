"use client";

import { useState } from "react";
import { Code2, SlidersHorizontal, Radar, ScrollText, ShieldCheck } from "lucide-react";
import { InstallTab } from "./tabs/InstallTab";
import { ConfigureTab } from "./tabs/ConfigureTab";
import { ScanTab } from "./tabs/ScanTab";
import { LogsTab } from "./tabs/LogsTab";
import { GuardiansTab } from "./tabs/GuardiansTab";
import type { ConsentSettings, CookieRow, ConsentEvent, GuardianConsent } from "./types";

const TABS = [
  { id: "install", label: "Install", icon: Code2 },
  { id: "configure", label: "Configure", icon: SlidersHorizontal },
  { id: "scan", label: "Cookie scan", icon: Radar },
  { id: "logs", label: "Consent logs", icon: ScrollText },
  { id: "guardians", label: "Guardians", icon: ShieldCheck },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ConsentTabs({
  settings,
  cookies,
  events,
  guardians,
  snippetUrl,
  domain,
}: {
  settings: ConsentSettings;
  cookies: CookieRow[];
  events: ConsentEvent[];
  guardians: GuardianConsent[];
  snippetUrl: string;
  domain: string;
}) {
  const [tab, setTab] = useState<TabId>("install");

  return (
    <div>
      <div className="flex gap-1 border-b border-hairline-strong mb-6" role="tablist">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          const count = t.id === "logs" ? events.length : t.id === "guardians" ? guardians.length : 0;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
                active
                  ? "border-seal text-ink"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={active ? 2.2 : 1.8} />
              {t.label}
              {(t.id === "logs" || t.id === "guardians") && count > 0 && (
                <span className="font-mono text-[10.5px] font-bold bg-paper-deep border border-hairline-strong rounded-full px-1.5">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "install" && <InstallTab snippetUrl={snippetUrl} banner={settings.banner} />}
      {tab === "configure" && <ConfigureTab initial={settings} />}
      {tab === "scan" && <ScanTab initialCookies={cookies} defaultDomain={domain} />}
      {tab === "logs" && <LogsTab events={events} />}
      {tab === "guardians" && <GuardiansTab initial={guardians} />}
    </div>
  );
}
