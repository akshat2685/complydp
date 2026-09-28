"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ScrollText,
  SlidersHorizontal,
  FileCheck2,
  Siren,
  Network,
  Building2,
  Fingerprint,
  Settings,
} from "lucide-react";

const items = [
  { name: "Overview", href: "/", icon: ScrollText, count: (c: Counts) => c.findings },
  { name: "Consent", href: "/consent", icon: SlidersHorizontal, count: (c: Counts) => c.consent },
  { name: "Rights Desk", href: "/rights", icon: FileCheck2, count: (c: Counts) => c.dsr },
  { name: "Breach", href: "/breach", icon: Siren, count: (c: Counts) => c.breach },
  { name: "Data Map", href: "/data-map", icon: Network, count: (c: Counts) => c.unmapped },
  { name: "Vendors", href: "/vendors", icon: Building2, count: (c: Counts) => c.vendors },
  { name: "Evidence", href: "/evidence", icon: Fingerprint, count: () => 0 },
  { name: "Settings", href: "/settings", icon: Settings, count: () => 0 },
];

export interface Counts {
  findings: number;
  consent: number;
  dsr: number;
  breach: number;
  unmapped: number;
  vendors: number;
}

export function NavLinks({ counts }: { counts: Counts }) {
  const pathname = usePathname();
  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const n = item.count(counts);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center justify-between px-3 py-[7px] rounded text-[13px] font-medium transition-colors ${
              isActive ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-deep"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Icon
                className="w-[15px] h-[15px]"
                strokeWidth={isActive ? 2.2 : 1.8}
                aria-hidden
              />
              {item.name}
            </span>
            {n > 0 && (
              <span
                className={`font-mono text-[10.5px] font-bold px-1.5 py-px rounded-full border ${
                  isActive
                    ? "bg-seal text-white border-seal"
                    : "bg-seal-bg text-seal border-seal/25"
                }`}
              >
                {n}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
