import { db, ok, ledgerVerify } from "@/server/api";

export async function GET() {
  let database = "unreachable";
  let ledger: { entries: number; chain: string } = { entries: 0, chain: "unknown" };
  try {
    const d = db();
    (d.prepare("SELECT 1 AS ok").get() as { ok: number });
    database = "connected (sqlite)";
    const n = d.prepare("SELECT COUNT(*) AS n FROM evidence_ledger").get() as { n: number };
    const v = ledgerVerify(d);
    ledger = { entries: n.n, chain: v.ok ? `valid (${v.checked} entries)` : `BROKEN at seq ${v.brokenAt}` };
  } catch (e) {
    database = `error: ${e instanceof Error ? e.message : "unknown"}`;
  }

  return ok({
    status: database.startsWith("connected") ? "ok" : "degraded",
    service: "pramaan-mvp",
    framework: "Digital Personal Data Protection Act, 2023",
    timestamp: new Date().toISOString(),
    database,
    evidence_ledger: ledger,
    // What this build honestly does and does not do:
    capabilities: {
      persistence: "sqlite (local file)",
      evidence_chain: "sha256, verified on boot",
      cookie_scan: "static server-side fetch (no JS execution)",
      pii_classification: "rule-based keyword engine (not ML)",
      github_scan: "manual — token required, not configured in MVP seed",
      notifications: "logged only — no real email/SMS sender wired",
    },
  });
}
