"use client";

import { Seal } from "@/components/ui";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-4 flex justify-center">
          <Seal size={44} />
        </div>
        <p className="kicker kicker-danger mb-2">Something went wrong</p>
        <h1 className="font-display text-[26px] font-semibold leading-tight text-ink">
          The registry hit a snag
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-muted">
          The page failed to load. Your data is untouched — the evidence ledger is
          append-only and nothing was written by this error.
        </p>
        <button type="button" onClick={reset} className="btn btn-ink mt-6">
          Try again
        </button>
        <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
          DPDP Act, 2023 · Evidence-first privacy operations
        </p>
      </div>
    </div>
  );
}
