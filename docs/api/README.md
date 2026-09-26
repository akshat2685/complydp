# complyDP REST API Documentation

Base Path: `/api`

All API endpoints return JSON and enforce strict tenant scoping via authenticated session context.

## Endpoints Summary

### System Health
- `GET /api/health`: Returns service health, uptime, and sensor status.

### Web Properties
- `GET /api/properties`: List web properties monitored for tenant.
- `POST /api/properties`: Register new web property for crawler monitoring.

### Findings (Attention Queue)
- `GET /api/findings`: List findings. Supports query params `?status=Needs+Review` and `?category=Consent`.
- `PATCH /api/findings`: Resolve finding or record DPO sign-off note.

### Consent Intelligence & Ledger
- `GET /api/consent/events`: Query pseudonymous consent audit records.
- `POST /api/consent/events`: Record incoming affirmative opt-in or withdrawal event from web banner.

### Data Principal Rights
- `GET /api/requests`: Query requests. Supports query param `?status=In+Progress`.
- `POST /api/requests`: Submit new Data Principal rights request.

### Privacy Incidents & Dual Clocks
- `GET /api/incidents`: Query active privacy incidents and statutory clock countdowns.
- `PATCH /api/incidents`: Update regulatory obligation status (e.g. submit DPBI report).

### Record of Processing Activities (RoPA)
- `GET /api/processing-activities`: Query mandatory RoPA activities, purposes, and retention lifecycles.

### Data Processors & Vendors
- `GET /api/vendors`: Query vendor directory, DPA status, and cross-border transfer compliance.

### Evidence Locker
- `POST /api/evidence/exports`: Compile and export a cryptographically signed compliance audit package.
