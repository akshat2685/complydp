"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, Inbox } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Seal — the Pramaan mark. A double-ring registry stamp.             */
/* ------------------------------------------------------------------ */
export function Seal({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Pramaan seal"
      className="shrink-0"
    >
      <circle cx="24" cy="24" r="22" fill="#a33327" />
      <circle
        cx="24"
        cy="24"
        r="18.5"
        fill="none"
        stroke="#f6f4ee"
        strokeWidth="1.6"
        strokeDasharray="3 2.4"
      />
      <circle cx="24" cy="24" r="13.5" fill="none" stroke="#f6f4ee" strokeWidth="1.2" />
      <text
        x="24"
        y="30.5"
        textAnchor="middle"
        fill="#f6f4ee"
        fontFamily="Georgia, 'Palatino Linotype', serif"
        fontWeight="bold"
        fontSize="17"
      >
        P
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  PageHead — serif title, mono kicker, hairline rule, meta slot.     */
/* ------------------------------------------------------------------ */
export function PageHead({
  kicker,
  title,
  lede,
  meta,
}: {
  kicker: string;
  title: string;
  lede?: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="border-b border-hairline-strong pb-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="kicker mb-1.5">{kicker}</div>
          <h1 className="font-display text-[26px] leading-tight text-ink font-bold tracking-tight">
            {title}
          </h1>
          {lede && <p className="text-[13px] text-ink-muted mt-1.5 max-w-2xl">{lede}</p>}
        </div>
        {meta && <div className="shrink-0 pt-1">{meta}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chip — status pill. tone: amber | red | green | blue | seal | mute */
/* ------------------------------------------------------------------ */
const chipTones: Record<string, string> = {
  amber: "bg-status-amberBg text-status-amber border-status-amber/30",
  red: "bg-status-redBg text-status-red border-status-red/30",
  green: "bg-status-greenBg text-status-green border-status-green/30",
  blue: "bg-status-blueBg text-status-blue border-status-blue/30",
  seal: "bg-seal-bg text-seal border-seal/30",
  teal: "bg-teal-bg text-teal border-teal/30",
  mute: "bg-paper-deep text-ink-muted border-hairline-strong",
  ink: "bg-ink text-paper border-ink",
};

export function Chip({
  tone = "mute",
  children,
  dot = true,
}: {
  tone?: keyof typeof chipTones;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span className={`chip ${chipTones[tone]}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Card — paper panel with hairline border.                           */
/* ------------------------------------------------------------------ */
export function Card({
  children,
  className = "",
  pad = true,
}: {
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div
      className={`bg-paper-panel border border-hairline rounded-md shadow-card ${pad ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display text-[16px] font-bold text-ink">{children}</h2>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  EmptyState                                                         */
/* ------------------------------------------------------------------ */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-hairline-strong rounded-md bg-paper py-10 px-6 text-center">
      <Inbox className="w-7 h-7 text-ink-faint mx-auto mb-3" strokeWidth={1.5} />
      <div className="font-display text-[15px] font-bold text-ink">{title}</div>
      <p className="text-[12.5px] text-ink-muted mt-1 max-w-md mx-auto">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Drawer — right slide-over                                           */
/* ------------------------------------------------------------------ */
export function Drawer({
  title,
  kicker,
  onClose,
  children,
  wide,
}: {
  title: string;
  kicker?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/30 fade-in" onClick={onClose} />
      <div
        className={`absolute right-0 top-0 bottom-0 bg-paper-panel border-l border-hairline-strong shadow-drawer drawer-in overflow-y-auto ${wide ? "w-[560px]" : "w-[440px]"} max-w-[94vw]`}
      >
        <div className="sticky top-0 bg-paper-panel border-b border-hairline px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div>
            {kicker && <div className="kicker mb-1">{kicker}</div>}
            <div className="font-display text-[17px] font-bold text-ink leading-snug">{title}</div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-paper-deep rounded"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LiveClock — ticks every second. Shows elapsed or remaining.        */
/* ------------------------------------------------------------------ */
function fmtDur(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

export function ElapsedClock({ from, label }: { from: string | number; label: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Date.now() - new Date(from).getTime();
  return (
    <div>
      <div className="font-mono text-[19px] font-bold text-ink tnum">{fmtDur(ms)}</div>
      <div className="text-[11px] text-ink-muted">{label}</div>
    </div>
  );
}

export function CountdownClock({
  deadline,
  label,
  warnAtMs = 6 * 3600 * 1000,
}: {
  deadline: string | number;
  label: string;
  warnAtMs?: number;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = new Date(deadline).getTime() - Date.now();
  const overdue = ms < 0;
  const warn = !overdue && ms < warnAtMs;
  const color = overdue ? "text-status-red" : warn ? "text-status-amber" : "text-ink";
  return (
    <div>
      <div className={`font-mono text-[19px] font-bold tnum ${color}`}>
        {overdue ? "OVERDUE " : ""}
        {fmtDur(ms)}
        {overdue ? "" : " left"}
      </div>
      <div className="text-[11px] text-ink-muted">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stepper — numbered workflow steps                                  */
/* ------------------------------------------------------------------ */
export function Stepper({
  steps,
  current,
  done,
}: {
  steps: { title: string; hint: string }[];
  current: number;
  done: number;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
      {steps.map((s, i) => {
        const state = i < done ? "done" : i === current ? "current" : "todo";
        return (
          <div
            key={i}
            className={`border rounded-md p-3 ${
              state === "current"
                ? "border-seal bg-seal-bg/40"
                : state === "done"
                  ? "border-hairline-strong bg-paper-deep/60"
                  : "border-hairline bg-paper-panel"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                  state === "current"
                    ? "bg-seal text-white"
                    : state === "done"
                      ? "bg-teal text-white"
                      : "bg-paper-deep text-ink-muted border border-hairline-strong"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-[12px] font-bold ${state === "todo" ? "text-ink-faint" : "text-ink"}`}
              >
                {s.title}
              </span>
            </div>
            <p className="text-[11px] text-ink-muted leading-snug">{s.hint}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ProofSeal — shows a short hash with a verification ring.           */
/* ------------------------------------------------------------------ */
export function ProofSeal({ hash, label }: { hash: string; label?: string }) {
  const short = hash.length > 16 ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : hash;
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-teal-dark bg-teal-bg border border-teal/25 rounded px-1.5 py-0.5"
      title={hash}
    >
      <svg width="11" height="11" viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="5" />
        <path
          d="M15 24.5 21.5 31 33 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label && <span className="font-sans font-semibold text-[10px]">{label}</span>}
      {short}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  BackLink                                                           */
/* ------------------------------------------------------------------ */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-muted hover:text-ink mb-3"
    >
      <span aria-hidden>←</span> {children}
    </Link>
  );
}
