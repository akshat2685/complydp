import { qOne, ok, ledgerVerify, IS_REMOTE } from "@/server/api";
import { readGithubToken } from "@/server/github";

export async function GET() {
  const backend = IS_REMOTE ? "turso (remote libsql)" : "sqlite (local file)";
  let database = "unreachable";
  let ledger: { entries: number; chain: string } = { entries: 0, chain: "unknown" };
  try {
    await qOne("SELECT 1 AS ok");
    database = `connected (${backend})`;
    const n = await qOne("SELECT COUNT(*) AS n FROM evidence_ledger") as { n: number };
    const v = await ledgerVerify();
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
      persistence: backend,
      evidence_chain: "sha256, verified on boot",
      cookie_scan: "static server-side fetch (no JS execution)",
      pii_classification: "rule-based keyword engine (not ML)",
      github_scan: await readGithubToken()
        ? "real — token configured (5k req/hr)"
        : "real — optional, unauthenticated public-repo scans (60 req/hr)",
      notifications: "logged only — no real email/SMS sender wired",
    },
  });
}
