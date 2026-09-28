/**
 * Pramaan server data layer — SQLite via @libsql/client (async).
 *
 * Local dev: a SQLite file at ./data/pramaan.db (or $PRAMAAN_DB_PATH).
 * Production: a remote Turso database when TURSO_DATABASE_URL is set to a
 * libsql:// or https:// URL (auth via TURSO_AUTH_TOKEN). The SQL dialect is
 * SQLite in both cases, so every statement below works unchanged.
 *
 * Schema is created on first boot (CREATE TABLE IF NOT EXISTS) and seeded
 * with demo tenant data when empty.
 *
 * ONLY import this from server contexts (API routes, server components).
 * Never from client components.
 */
import { createClient, type Client, type InArgs } from "@libsql/client";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

/** True when pointed at a remote Turso database. */
export const IS_REMOTE = (() => {
  const url = process.env.TURSO_DATABASE_URL ?? "";
  return url.startsWith("libsql://") || url.startsWith("https://");
})();

const DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_DB_PATH = process.env.PRamaan_DB_PATH || path.join(DATA_DIR, "pramaan.db");

let _client: Client | null = null;
let _init: Promise<Client> | null = null;

/**
 * Cross-process mutex around first-boot init (schema + seed).
 * `next build` prerenders pages in parallel worker processes; without this,
 * several workers race to migrate/seed the same SQLite file, and the native
 * driver's lock contention surfaces as SQLITE_BUSY or indefinite hangs.
 * mkdir(2) is atomic, so the first worker to create the lock dir wins; the
 * rest wait, then find the DB already seeded and skip the seed. Stale locks
 * (crashed worker) expire after 60s.
 */
async function withInitLock<T>(fn: () => Promise<T>): Promise<T> {
  const lockPath = LOCAL_DB_PATH + ".initlock";
  const start = Date.now();
  for (;;) {
    try {
      fs.mkdirSync(lockPath);
      break;
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      try {
        const ageMs = Date.now() - fs.statSync(lockPath).mtimeMs;
        if (ageMs > 60_000) {
          fs.rmdirSync(lockPath);
          continue;
        }
      } catch {
        /* lock vanished mid-check; retry */
      }
      if (Date.now() - start > 120_000) {
        throw new Error(`timed out waiting for DB init lock ${lockPath}`);
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  try {
    return await fn();
  } finally {
    try {
      fs.rmdirSync(lockPath);
    } catch {
      /* another process already cleaned up; ignore */
    }
  }
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

async function initClient(): Promise<Client> {
  if (IS_REMOTE) {
    const url = process.env.TURSO_DATABASE_URL as string;
    const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    await migrate(client);
    return client;
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  // Serialize first-boot across processes (see withInitLock).
  return withInitLock(async () => {
    const client = createClient({ url: "file:" + LOCAL_DB_PATH });
    await client.execute("PRAGMA journal_mode = WAL;");
    await client.execute("PRAGMA foreign_keys = ON;");
    await migrate(client);
    return client;
  });
}

/**
 * Singleton client, initialized (schema + seed) on first use.
 * Concurrent callers share the one in-flight init; a failed boot clears the
 * promise so the next call retries instead of replaying the same rejection.
 */
export async function db(): Promise<Client> {
  if (_client) return _client;
  if (!_init) {
    _init = initClient();
    _init.then(
      (c) => {
        _client = c;
        _init = null;
      },
      () => {
        _init = null;
      }
    );
  }
  return _init;
}

/* ------------------------------------------------------------------ */
/*  Query helpers — keep call-site diffs small.                         */
/* ------------------------------------------------------------------ */

/** Run a SELECT; rows come back as plain objects (libsql default row mode). */
export async function q<T>(sql: string, ...args: unknown[]): Promise<T[]> {
  const c = await db();
  const rs = await c.execute({ sql, args: args as InArgs });
  return rs.rows as unknown as T[];
}

/** Run a SELECT; the first row, or undefined when there are no rows. */
export async function qOne<T>(sql: string, ...args: unknown[]): Promise<T | undefined> {
  const rows = await q<T>(sql, ...args);
  return rows[0];
}

/** Run an INSERT/UPDATE/DELETE. */
export async function run(
  sql: string,
  ...args: unknown[]
): Promise<{ changes: number; lastInsertRowid: number }> {
  const c = await db();
  return runC(c, sql, args);
}

/**
 * Client-bound query helpers. Used internally when a caller already holds a
 * client — notably during first-boot init, where going through db() would
 * re-enter the in-flight init promise and deadlock (migrate → seed →
 * db() → same promise).
 */
export async function qC<T>(c: Client, sql: string, args: unknown[]): Promise<T[]> {
  const rs = await c.execute({ sql, args: args as InArgs });
  return rs.rows as unknown as T[];
}

export async function runC(
  c: Client,
  sql: string,
  args: unknown[]
): Promise<{ changes: number; lastInsertRowid: number }> {
  const rs = await c.execute({ sql, args: args as InArgs });
  return { changes: rs.rowsAffected, lastInsertRowid: Number(rs.lastInsertRowid ?? 0) };
}

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS tenant (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  dpo_name TEXT NOT NULL,
  dpo_email TEXT NOT NULL,
  settings_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenant(id),
  domain TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES properties(id),
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TEXT NOT NULL,
  finished_at TEXT,
  stats_json TEXT NOT NULL DEFAULT '{}',
  error TEXT
);

CREATE TABLE IF NOT EXISTS cookies (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'unclassified',
  source TEXT NOT NULL DEFAULT 'auto',
  description TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  vendor_hint TEXT NOT NULL DEFAULT '',
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  UNIQUE(property_id, name)
);

CREATE TABLE IF NOT EXISTS consent_events (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id),
  visitor_hash TEXT NOT NULL,
  age_band TEXT NOT NULL DEFAULT 'adult',
  categories_json TEXT NOT NULL,
  consent_mode TEXT NOT NULL DEFAULT 'banner',
  notice_version TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  event_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_consent_visitor ON consent_events(visitor_hash);
CREATE INDEX IF NOT EXISTS idx_consent_created ON consent_events(created_at);

CREATE TABLE IF NOT EXISTS guardian_consents (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id),
  visitor_hash TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  contact TEXT NOT NULL,
  contact_hash TEXT NOT NULL,
  consent_given INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_guardian_visitor ON guardian_consents(visitor_hash);
CREATE INDEX IF NOT EXISTS idx_guardian_created ON guardian_consents(created_at);

CREATE TABLE IF NOT EXISTS dsr_cases (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  assignee TEXT NOT NULL DEFAULT '',
  sla_due_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  resolution_note TEXT NOT NULL DEFAULT '',
  tasks_json TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_dsr_status ON dsr_cases(status);

CREATE TABLE IF NOT EXISTS breach_cases (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  severity TEXT NOT NULL DEFAULT 'high',
  awareness_at TEXT NOT NULL,
  systems_json TEXT NOT NULL DEFAULT '[]',
  categories_json TEXT NOT NULL DEFAULT '[]',
  affected_count INTEGER NOT NULL DEFAULT 0,
  step INTEGER NOT NULL DEFAULT 0,
  board_notified_at TEXT,
  users_notified_at TEXT,
  created_at TEXT NOT NULL,
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS breach_comms (
  id TEXT PRIMARY KEY,
  breach_id TEXT NOT NULL REFERENCES breach_cases(id),
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TEXT NOT NULL,
  sent_at TEXT,
  provider_id TEXT,
  provider_response TEXT
);

CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  domain TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'India',
  dpa_status TEXT NOT NULL DEFAULT 'not_started',
  risk_tier TEXT NOT NULL DEFAULT 'medium',
  owner TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  discovered_via TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questionnaires (
  id TEXT PRIMARY KEY,
  vendor_id TEXT REFERENCES vendors(id),
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_questionnaires_vendor ON questionnaires(vendor_id);

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id TEXT PRIMARY KEY,
  questionnaire_id TEXT REFERENCES questionnaires(id),
  answers_json TEXT NOT NULL,
  submitted_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_qresponses_questionnaire ON questionnaire_responses(questionnaire_id);

CREATE TABLE IF NOT EXISTS systems (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  owner_team TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS data_fields (
  id TEXT PRIMARY KEY,
  system_id TEXT NOT NULL REFERENCES systems(id),
  field_name TEXT NOT NULL,
  pii_category TEXT NOT NULL DEFAULT 'none',
  classification_source TEXT NOT NULL DEFAULT 'auto',
  mapped_activity_id TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_fields_system ON data_fields(system_id);

CREATE TABLE IF NOT EXISTS processing_activities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT '',
  owner_team TEXT NOT NULL DEFAULT '',
  data_subjects_json TEXT NOT NULL DEFAULT '[]',
  lawful_basis TEXT NOT NULL DEFAULT '',
  retention TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_vendors (
  activity_id TEXT NOT NULL REFERENCES processing_activities(id),
  vendor_id TEXT NOT NULL REFERENCES vendors(id),
  PRIMARY KEY (activity_id, vendor_id)
);

CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'needs_review',
  legal_ref TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  resolution_note TEXT NOT NULL DEFAULT '',
  evidence_hash TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);

CREATE TABLE IF NOT EXISTS evidence_ledger (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  prev_hash TEXT NOT NULL,
  entry_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ledger_entity ON evidence_ledger(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS notices (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published_at TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 0
);
`;

async function migrate(client: Client) {
  await client.executeMultiple(SCHEMA);
  await ensureBreachCommsProviderColumns(client);
  // Seed when the tenant table is empty.
  const rs = await client.execute("SELECT COUNT(*) AS n FROM tenant");
  const n = Number((rs.rows[0] as unknown as { n: unknown } | undefined)?.n ?? 0);
  if (n === 0 && (await claimSeed(client))) {
    try {
      await seedDemoTenant(client);
    } catch (e) {
      // Release the claim so a later boot retries instead of serving half-seeded data.
      await client.execute("DELETE FROM _seed_claim WHERE id = 1");
      throw e;
    }
    // Fail fast: the seed just built hash chains. A broken chain here means the
    // seed misfired, and booting would serve a corrupt evidence ledger.
    const v = await ledgerVerifyClient(client);
    if (!v.ok) throw new Error(`seed produced a broken evidence chain (broken at seq ${v.brokenAt})`);
  }
}

/**
 * Atomic seed claim: INSERT OR IGNORE wins for exactly one process, so
 * concurrent boots (build prerender workers + runtime, or two replicas)
 * can never double-seed. The mkdir file lock only covers same-machine.
 */
async function claimSeed(client: Client): Promise<boolean> {
  await client.execute("CREATE TABLE IF NOT EXISTS _seed_claim (id INTEGER PRIMARY KEY CHECK (id = 1))");
  const rs = await client.execute("INSERT OR IGNORE INTO _seed_claim (id) VALUES (1)");
  return Number(rs.rowsAffected ?? 0) === 1;
}

/**
 * Idempotent column migration for breach_comms: existing DBs created before
 * the provider-tracking columns existed get them via ALTER TABLE.
 * Remote-safe: instead of PRAGMA table_info, just try the ALTER and ignore
 * the duplicate-column error (fresh DBs already have the column from CREATE TABLE).
 */
async function ensureBreachCommsProviderColumns(client: Client) {
  for (const col of ["provider_id", "provider_response"]) {
    try {
      await client.execute(`ALTER TABLE breach_comms ADD COLUMN ${col} TEXT`);
    } catch (e) {
      if (e instanceof Error && /duplicate column/i.test(e.message)) continue;
      throw e;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

export function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/* ------------------------------------------------------------------ */
/*  Evidence ledger — real SHA-256 hash chain.                         */
/* ------------------------------------------------------------------ */

/**
 * Serializes hash-chained appends within this process: every append is a
 * read-last-hash → insert pair, and concurrent requests must not interleave
 * that pair or the chain forks.
 */
let _appendChain: Promise<void> = Promise.resolve();
async function withAppendLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = _appendChain;
  let release!: () => void;
  _appendChain = new Promise<void>((r) => { release = r; });
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

export async function ledgerAppend(entry: {
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  summary: string;
  details?: Record<string, unknown>;
}, client?: Client): Promise<{ seq: number; entry_hash: string }> {
  return withAppendLock(async () => {
  const c = client ?? (await db());
  const last = await qC<{ entry_hash: string }>(
    c,
    "SELECT entry_hash FROM evidence_ledger ORDER BY seq DESC LIMIT 1",
    []
  ).then((rows) => rows[0]);
  const prev = last?.entry_hash ?? "GENESIS";
  const ts = nowIso();
  const details = JSON.stringify(entry.details ?? {});
  const payload = [prev, ts, entry.actor, entry.action, entry.entity_type, entry.entity_id, entry.summary, details].join("|");
  const hash = sha256(payload);
  const res = await runC(
    c,
    `INSERT INTO evidence_ledger (ts, actor, action, entity_type, entity_id, summary, details_json, prev_hash, entry_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ts, entry.actor, entry.action, entry.entity_type, entry.entity_id, entry.summary, details, prev, hash]
  );
  return { seq: res.lastInsertRowid, entry_hash: hash };
  });
}

export async function ledgerVerifyClient(client: Client): Promise<{ ok: boolean; checked: number; brokenAt?: number }> {
  const rows = await qC<{
    seq: number; ts: string; actor: string; action: string; entity_type: string;
    entity_id: string; summary: string; details_json: string; prev_hash: string; entry_hash: string;
  }>(
    client,
    "SELECT seq, ts, actor, action, entity_type, entity_id, summary, details_json, prev_hash, entry_hash FROM evidence_ledger ORDER BY seq ASC",
    []
  );
  let prev = "GENESIS";
  for (const r of rows) {
    if (r.prev_hash !== prev) return { ok: false, checked: rows.length, brokenAt: r.seq };
    const payload = [r.prev_hash, r.ts, r.actor, r.action, r.entity_type, r.entity_id, r.summary, r.details_json].join("|");
    if (sha256(payload) !== r.entry_hash) return { ok: false, checked: rows.length, brokenAt: r.seq };
    prev = r.entry_hash;
  }
  return { ok: true, checked: rows.length };
}

export async function ledgerVerify(): Promise<{ ok: boolean; checked: number; brokenAt?: number }> {
  return ledgerVerifyClient(await db());
}

/* Consent events use the same chaining idea, scoped per property. */
export async function consentAppend(ev: {
  property_id: string;
  visitor_hash: string;
  age_band: string;
  categories: { necessary: boolean; functional: boolean; analytics: boolean; marketing: boolean };
  consent_mode: string;
  notice_version: string;
}, client?: Client): Promise<{ id: string; event_hash: string }> {
  return withAppendLock(async () => {
  const c = client ?? (await db());
  const last = await qC<{ event_hash: string }>(
    c,
    "SELECT event_hash FROM consent_events WHERE property_id = ? ORDER BY rowid DESC LIMIT 1",
    [ev.property_id]
  ).then((rows) => rows[0]);
  const prev = last?.event_hash ?? "GENESIS";
  const ts = nowIso();
  const cats = JSON.stringify(ev.categories);
  const payload = [prev, ts, ev.property_id, ev.visitor_hash, ev.age_band, cats, ev.consent_mode, ev.notice_version].join("|");
  const hash = sha256(payload);
  const id = newId("cev");
  await runC(
    c,
    `INSERT INTO consent_events (id, property_id, visitor_hash, age_band, categories_json, consent_mode, notice_version, created_at, prev_hash, event_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, ev.property_id, ev.visitor_hash, ev.age_band, cats, ev.consent_mode, ev.notice_version, ts, prev, hash]
  );
  return { id, event_hash: hash };
  });
}

/* ------------------------------------------------------------------ */
/*  Seed — imported lazily to keep this file focused.                  */
/* ------------------------------------------------------------------ */
import { seedDemoTenant } from "./seed";
