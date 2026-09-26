# Contributing to complyDP

Thank you for your interest in contributing to **complyDP**!

## Core Engineering Principles
1. **Evidence-First**: Every new scanner, classifier, or finding must maintain provenance (telemetry source, location, timestamp, confidence, SHA-256 seal).
2. **Human-in-the-Loop**: Automation may suggest; humans approve. Never silently modify the RoPA baseline without explicit review.
3. **Data Minimization**: Never store raw sensitive personal data or full IP addresses in telemetry streams or consent logs.
4. **Tenant Isolation**: All database queries must be strictly scoped by `tenant_id`.

## Development Workflow
1. Fork and create a feature branch (`feat/your-feature-name` or `fix/your-fix-name`).
2. Install dependencies: `npm install`.
3. Verify tests pass: `npm test`.
4. Ensure the production build succeeds: `npm run build`.
5. Open a Pull Request with a clear description and testing evidence.
