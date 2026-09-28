/** Boot the database (schema + seed run automatically on first open). */
import { qOne, ledgerVerify } from "../src/server/db";

async function main() {
  const t = await qOne<{ n: number }>("SELECT COUNT(*) AS n FROM tenant");
  const e = await qOne<{ n: number }>("SELECT COUNT(*) AS n FROM evidence_ledger");
  const v = await ledgerVerify();
  console.log(`tenant rows: ${t?.n ?? 0}, ledger entries: ${e?.n ?? 0}, chain valid: ${v.ok}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
