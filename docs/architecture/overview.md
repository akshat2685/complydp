# complyDP Architecture Overview

## 1. Product Thesis
compliance/privacy teams in Indian organizations currently struggle with fragmented information across websites, trackers, SaaS tools, databases, vendor contracts, consent logs, Data Principal requests, and incident notifications.

**complyDP** is an AI-native Privacy Operations Center for India that operationalizes compliance under the **Digital Personal Data Protection (DPDP) Act, 2023** and **DPDP Rules, 2026**.

The operational loop is:
```text
DISCOVER → CLASSIFY → MAP → CONTROL → REVIEW → EVIDENCE → MONITOR
```

The core mental model:
> *“What personal data exists, where does it move, why is it processed, who processes it, what controls apply, and can we prove it?”*

---

## 2. System Architecture (Modular Monolith)

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

## 3. Core Modules
- **Identity & Tenancy**: Multi-tenant isolation with strict `tenant_id` scoping and capability-based authorization.
- **Web Compliance & Consent**: Headless crawler discovering cookies, tracking scripts, and pre-consent execution gaps.
- **Auditable Consent Ledger**: Cryptographic pseudonymized visitor tracking (`anon_sha256_...`) with zero raw PII storage.
- **Data Principal Rights Portal**: Operational case management for deletion, correction, access, and third-party disclosures with statutory SLA tracking.
- **Incident Command Center**: Strict dual-clock separation between the 72-hour DPBI regulatory board reporting clock and the direct Data Principal notice standard (*"Without Delay"*).
- **Discovery & RoPA Mapping**: AST repository scanning for Indian identifiers (PAN, Aadhaar, mobile numbers) linked to Record of Processing Activities.
- **Evidence Locker**: Tamper-evident SHA-256 provenance chains anchoring every operational claim to verifiable telemetry.
