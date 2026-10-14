import Link from "next/link";
import { Seal } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-4 flex justify-center">
          <Seal size={44} />
        </div>
        <p className="kicker mb-2">Error · 404</p>
        <h1 className="font-display text-[26px] font-semibold leading-tight text-ink">
          This page isn&rsquo;t in the registry
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-muted">
          The link may be wrong, or the page may have moved. Nothing was recorded —
          this visit isn&rsquo;t written to the ledger.
        </p>
        <Link href="/" className="btn btn-ink mt-6">
          Back to the console
        </Link>
        <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
          DPDP Act, 2023 · Evidence-first privacy operations
        </p>
      </div>
    </div>
  );
}
