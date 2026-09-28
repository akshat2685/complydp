/**
 * Pramaan server data layer — SQLite via node:sqlite (Node 22+ native, zero deps).
 *
 * Single-file database at ./data/pramaan.db. Schema is created on first boot
 * (CREATE TABLE IF NOT EXISTS) and seeded with demo tenant data when empty.
 *
 * ONLY import this from server contexts (API routes, server components).
 * Never from client components.
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.PRamaan_DB_PATH || path.join(DATA_DIR, "pramaan.db");

let _db: DatabaseSync | null = null;

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function openDb(): DatabaseSync {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  _db = db;
  return db;
}

export function db(): DatabaseSync {
  return openDb();
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

function migrate(db: DatabaseSync) {
  db.exec(SCHEMA);
  ensureBreachCommsProviderColumns(db);
  // Seed when the tenant table is empty.
  const row = db.prepare("SELECT COUNT(*) AS n FROM tenant").get() as { n: number };
  if (row.n === 0) {
    seed(db);
  }
}

/**
 * Idempotent column migration for breach_comms: existing DBs created before
 * the provider-tracking columns existed get them via ALTER TABLE.
 */
function ensureBreachCommsProviderColumns(db: DatabaseSync) {
  const cols = db.prepare("PRAGMA table_info(breach_comms)").all() as Array<{ name: string }>;
  const names = new Set(cols.map((c) => c.name));
  if (!names.has("provider_id")) db.exec("ALTER TABLE breach_comms ADD COLUMN provider_id TEXT");
  if (!names.has("provider_response")) db.exec("ALTER TABLE breach_comms ADD COLUMN provider_response TEXT");
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
export function ledgerAppend(
  db: DatabaseSync,
  entry: {
    actor: string;
    action: string;
    entity_type: string;
    entity_id: string;
    summary: string;
    details?: Record<string, unknown>;
  }
): { seq: number; entry_hash: string } {
  const last = db
    .prepare("SELECT entry_hash FROM evidence_ledger ORDER BY seq DESC LIMIT 1")
    .get() as { entry_hash: string } | undefined;
  const prev = last?.entry_hash ?? "GENESIS";
  const ts = nowIso();
  const details = JSON.stringify(entry.details ?? {});
  const payload = [prev, ts, entry.actor, entry.action, entry.entity_type, entry.entity_id, entry.summary, details].join("|");
  const hash = sha256(payload);
  const res = db
    .prepare(
      `INSERT INTO evidence_ledger (ts, actor, action, entity_type, entity_id, summary, details_json, prev_hash, entry_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(ts, entry.actor, entry.action, entry.entity_type, entry.entity_id, entry.summary, details, prev, hash);
  return { seq: Number(res.lastInsertRowid), entry_hash: hash };
}

export function ledgerVerify(db: DatabaseSync): { ok: boolean; checked: number; brokenAt?: number } {
  const rows = db
    .prepare("SELECT seq, ts, actor, action, entity_type, entity_id, summary, details_json, prev_hash, entry_hash FROM evidence_ledger ORDER BY seq ASC")
    .all() as Array<{
    seq: number; ts: string; actor: string; action: string; entity_type: string;
    entity_id: string; summary: string; details_json: string; prev_hash: string; entry_hash: string;
  }>;
  let prev = "GENESIS";
  for (const r of rows) {
    if (r.prev_hash !== prev) return { ok: false, checked: rows.length, brokenAt: r.seq };
    const payload = [r.prev_hash, r.ts, r.actor, r.action, r.entity_type, r.entity_id, r.summary, r.details_json].join("|");
    if (sha256(payload) !== r.entry_hash) return { ok: false, checked: rows.length, brokenAt: r.seq };
    prev = r.entry_hash;
  }
  return { ok: true, checked: rows.length };
}

/* Consent events use the same chaining idea, scoped per property. */
export function consentAppend(
  db: DatabaseSync,
  ev: {
    property_id: string;
    visitor_hash: string;
    age_band: string;
    categories: { necessary: boolean; functional: boolean; analytics: boolean; marketing: boolean };
    consent_mode: string;
    notice_version: string;
  }
): { id: string; event_hash: string } {
  const last = db
    .prepare("SELECT event_hash FROM consent_events WHERE property_id = ? ORDER BY rowid DESC LIMIT 1")
    .get(ev.property_id) as { event_hash: string } | undefined;
  const prev = last?.event_hash ?? "GENESIS";
  const ts = nowIso();
  const cats = JSON.stringify(ev.categories);
  const payload = [prev, ts, ev.property_id, ev.visitor_hash, ev.age_band, cats, ev.consent_mode, ev.notice_version].join("|");
  const hash = sha256(payload);
  const id = newId("cev");
  db.prepare(
    `INSERT INTO consent_events (id, property_id, visitor_hash, age_band, categories_json, consent_mode, notice_version, created_at, prev_hash, event_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, ev.property_id, ev.visitor_hash, ev.age_band, cats, ev.consent_mode, ev.notice_version, ts, prev, hash);
  return { id, event_hash: hash };
}

/* ------------------------------------------------------------------ */
/*  Seed — imported lazily to keep this file focused.                  */
/* ------------------------------------------------------------------ */
import { seedDemoTenant } from "./seed";
function seed(db: DatabaseSync) {
  seedDemoTenant(db);
}
