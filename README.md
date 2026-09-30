# Pramaan

> **Evidence-first privacy operations for India's DPDP Act, 2023** — consent ledger, rights desk, breach resolution, data mapping and a tamper-evident proof chain. *Pramaan* (प्रमाण) means "proof" or "evidence".

This is a **working MVP**: every screen reads and writes a real SQLite database, consent events and registry actions are appended to a real SHA-256 hash chain, and the cookie scanner performs real server-side scans. No mock data, no fake sensors, no invented integrations.

## What it does

- **Registry overview** — live attention queue, system state and ledger activity. Every number is read from the database.
- **Consent Manager** — install snippet (real JS banner that posts to the API), banner configuration, **age-gating toggle** (under-18 → necessary-only cookies, recorded as `age_band=under18`), real cookie scans, and an append-only hash-chained consent log.
- **Rights Desk** — Data Principal request cases (access / correction / deletion / third-party disclosure) with SLA clocks, task checklists and assignment — plus a **public hosted request form** at `/r/[property]`.
- **Breach Resolution** — 4-step workflow (open → contain & start clocks → notify Board → notify users) with **live ticking statutory clocks** (72h Board deadline, "without delay" user notice), a notification log and a downloadable Board intimation pack.
- **Data Map** — systems (databases, SaaS, codebases, websites), field inventory with **rule-based India-aware PII classification** (PAN, Aadhaar, UPI, IFSC… — honestly labelled, not "AI"), processing activities and derived data flows.
- **Vendors** — processor register with DPA states and cross-border flags.
- **Evidence** — the tamper-evident ledger: verify the full chain, filter by entity, export evidence packs with a verification receipt.

## What it honestly doesn't do (yet)

- The cookie scanner is a **static** server-side fetch — it does not execute JavaScript, so JS-set cookies can be missed.
- PII classification is a **deterministic keyword engine**, not machine learning.
- Breach notifications are **logged as evidence**; no real email/WhatsApp sender is wired.
- GitHub codebase scanning needs a token and is not wired in the MVP.

## Quickstart

Prerequisites: **Node.js 22+** (SQLite uses the native `node:sqlite` module — zero extra dependencies).

```bash
git clone <this-repo>
cd pramaan-mvp
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database (`./data/pramaan.db`) is created and seeded automatically on first boot with a fictional demo tenant (Meridian Foods Pvt. Ltd.).

To reset demo data: Settings → Danger zone → Reset demo data (or `rm -rf data/` and restart).

## Verification

```bash
npm test        # live API smoke test (needs the dev server running)
npm run build   # production build
```

`GET /api/health` reports the database state, evidence-chain validity and an honest capability list.

## Design

The UI follows a **"Registry"** aesthetic — warm paper, ink text, hairline rules, serif display type, monospace for evidence — deliberately distinct from generic dashboard slop: every module has its own layout, and proof is a visual motif (seal marks, ledger tables, hash stamps).

## License

MIT — see [LICENSE](LICENSE).
