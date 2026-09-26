# ADR-0001: Use Modular Monolith for complyDP

## Status
Accepted

## Context
complyDP integrates telemetry from website crawls, source code repositories, databases, vendor registries, consent banners, privacy requests, and breach response workflows. A common failure mode in modern architectural design is prematurely fragmenting early-stage platforms into multiple distributed microservices, resulting in distributed transaction complexity, network overhead, deployment fragility, and broken audit trails.

## Decision
We adopt a **Modular Monolith** architecture for complyDP.
- The web frontend and typed REST API layer run together within Next.js.
- Domain boundaries (Identity, Web Compliance, Consent, Requests, Incidents, Discovery, Privacy Graph, Vendors, Evidence) are maintained via strict TypeScript interfaces and internal package boundaries.
- Asynchronous tasks (scanners, batch classifications, notification dispatchers) run through background workers consuming from a shared Redis queue.
- A single PostgreSQL database serves as the operational store with strict tenant isolation.

## Consequences
- **Positive**: Simplified deployments, direct relational joins across the RoPA graph, zero distributed RPC latency, single migration pipeline, atomic transactional integrity.
- **Negative**: Long-term scaling of individual components must be managed through bounded worker processes rather than independent container fleets (which can be partitioned later if real traffic demands).
