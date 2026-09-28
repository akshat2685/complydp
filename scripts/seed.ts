/** Boot the database (schema + seed run automatically on first open). */
import { db, ledgerVerify } from "../src/server/db";

const d = db();
const t = d.prepare("SELECT COUNT(*) AS n FROM tenant").get() as { n: number };
const e = d.prepare("SELECT COUNT(*) AS n FROM evidence_ledger").get() as { n: number };
const v = ledgerVerify(d);
console.log(`tenant rows: ${t.n}, ledger entries: ${e.n}, chain valid: ${v.ok}`);
