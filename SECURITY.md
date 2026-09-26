# Security Policy

## Supported Versions
| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability
The complyDP team takes security seriously. If you discover a security vulnerability:

1. **Do NOT open a public issue.**
2. Email full vulnerability details, reproduction steps, and potential impact to `security@complydp.io`.
3. You will receive an acknowledgment within 24 hours and regular status updates until the fix is deployed.

## Security Controls
- **Tenant Isolation**: Row-level and service-level tenant scoping prevents cross-tenant data leakage.
- **Data Minimization**: Consent event tracking stores only pseudonymous SHA-256 visitor identifiers.
- **Cryptographic Chaining**: Audit logs and evidence records use SHA-256 hashing to detect tampering.
- **Zero Raw Secrets in Logs**: Sensitive credentials, API keys, and authorization tokens are redacted at system boundaries.
