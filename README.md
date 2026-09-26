# complyDP

> **AI-native Privacy Operations Center for India** — continuous discovery, classification, consent tracking, and regulatory obligation enforcement under the **Digital Personal Data Protection (DPDP) Act, 2023** & **DPDP Rules, 2026**.

[![CI](https://github.com/akshat2685/complydp/actions/workflows/ci.yml/badge.svg)](https://github.com/akshat2685/complydp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Product Thesis

compliance/privacy teams in India currently navigate fragmented data across websites, cookies, trackers, SaaS endpoints, codebases, databases, processors, consent logs, Data Principal requests, and incident reports.

**complyDP** unites these into a unified **Privacy Operations Control Room**:

$$\text{DISCOVER} \longrightarrow \text{CLASSIFY} \longrightarrow \text{MAP} \longrightarrow \text{CONTROL} \longrightarrow \text{REVIEW} \longrightarrow \text{EVIDENCE} \longrightarrow \text{MONITOR}$$

The core mental model:
> *“What personal data exists, where does it move, why is it processed, who processes it, what controls apply, and can we prove it?”*

---

## Key Modules

- **Privacy Control Room**: Real-time attention queue answering *"What needs attention right now?"* — zero fake compliance scores; scannable operational findings with inline DPO approvals.
- **Website Consent & Cookie Intelligence**: Headless crawler scanning properties (e.g. `asterpay.in`), classifying trackers, and detecting pre-consent tracking gaps under DPDP Section 6.
- **Consent Event Ledger**: Cryptographically verifiable event stream with pseudonymous visitor hashes (`anon_sha256_...`) and zero raw PII storage.
- **Data Principal Rights Portal**: Operational case management for deletion, access, correction, and third-party disclosures with statutory SLA countdown clocks.
- **Incident Command Center**: Strict dual-clock separation:
  - **DPBI Statutory Board Reporting Clock**: 72-hour regulatory countdown under Rule 11.
  - **Data Principal Direct Notice**: *"Without Delay"* post-containment standard under Section 8(6).
- **Data Discovery & Privacy Graph**: Static AST source code parser detecting Indian personal data tokens (`customer_phone`, `pan_number`, `dob`) with relational RoPA mapping: *Token → Category → Activity → Purpose → Asset → Vendor → Control → Evidence*.
- **Evidence Locker**: Tamper-evident SHA-256 provenance chains anchoring every claim to observed telemetry with exportable regulatory audit packs.

---

## Architecture

```text
                         ┌─────────────────────┐
                         │   Web Application   │
                         │ Next.js App Router  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      API Layer      │
                         │ REST + Zod Validation
                         └──────────┬──────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
      ┌─────────────┐       ┌──────────────┐       ┌──────────────┐
      │ Web Privacy │       │ Data Subject │       │  Incidents   │
      │   Module    │       │   Requests   │       │    Module    │
      └─────────────┘       └──────────────┘       └──────────────┘
             │                      │                      │
             └──────────────────────┼──────────────────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ Domain Services &   │
                         │  Evidence Ledger    │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┼──────────────────┐
                  │                 │                  │
                  ▼                 ▼                  ▼
           ┌────────────┐   ┌─────────────┐   ┌─────────────┐
           │ PostgreSQL │   │ Redis Queue │   │ S3 Storage  │
           │ (Drizzle)  │   │  (BullMQ)   │   │  (MinIO)    │
           └────────────┘   └──────┬──────┘   └─────────────┘
                                   │
                                   ▼
                           ┌──────────────┐
                           │ Async Worker │
                           └──────┬───────┘
                                  │
                 ┌────────────────┼─────────────────┐
                 ▼                ▼                 ▼
          Website Scanner   GitHub Scanner   AI Classification
```

---

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend / API**: Typed Next.js REST API routes with Zod validation.
- **Database**: PostgreSQL 16+ with Drizzle ORM schema and strict tenant isolation.
- **Job Queue**: Redis 7+ with BullMQ async worker abstractions.
- **Object Storage**: S3-compatible storage (MinIO for local development).
- **CI / Testing**: Node test runner + tsx regulatory smoke test suite, GitHub Actions CI.

---

## Quickstart & Local Development

### 1. Prerequisites
- Node.js 22+
- npm 10+
- Docker & Docker Compose

### 2. Clone & Setup Environment
```bash
git clone https://github.com/akshat2685/complydp.git
cd complydp
cp .env.example .env
npm install
```

### 3. Start Local Infrastructure
```bash
docker compose up -d
```
Starts PostgreSQL on `:5432`, Redis on `:6379`, and MinIO Object Storage on `:9000`.

### 4. Seed Development Data
```bash
npm run db:seed
```
Seeds realistic tenant operational data for **AsterPay Technologies Pvt. Ltd.**

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & Testing

Run the automated smoke & regulatory test suite:
```bash
npm test
```

Run the production build:
```bash
npm run build
```

---

## License

This project is licensed under the [MIT License](LICENSE).
