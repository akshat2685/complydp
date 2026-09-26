# ADR-0004: Evidence-First Provenance and Tamper-Evident Chaining

## Status
Accepted

## Context
Traditional GRC tools operate on static, self-reported assertions (e.g., checking a box stating "Vendor X complies with DPA"). In investigations or regulatory inquiries by the Data Protection Board of India (DPBI), self-reported statements without cryptographic provenance carry minimal evidentiary weight.

## Decision
1. Evidence is treated as a first-class domain citizen across complyDP. Every claim, finding, classification, and incident containment must answer: *"Why do we believe this?"*
2. Each evidence record stores:
   - Observation timestamp
   - Telemetry source (e.g. headless browser log, AST parser line number)
   - Specific target location (URL, file path)
   - Observed payload snapshot
   - Confidence metric
   - Reviewer attestation
   - SHA-256 cryptographic proof seal
3. Important operational sequences (such as consent preferences and incident notifications) support tamper-evident event hashing (`previous_hash` + `event_hash`).

## Consequences
- **Positive**: High institutional trust, defensible audit trails, immediate exportability for regulatory audits.
- **Negative**: Additional hashing overhead and requirement to retain serialized telemetry snapshots in object storage.
