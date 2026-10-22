# AIFIRST · Connection readiness and owner-driven production gates

**Runbook date:** 2026-10-22. **Status:** local software tested; NO customer production release. 
`NOT_CONFIGURED` / `LOCAL_TESTED` / `EXTERNAL_ATTESTED` / `PRODUCTION_VERIFIED` must never be conflated.

## New operational controls

1. **Consistent encrypted SQLite snapshot + isolated restore** (local only, Node 22 `node:sqlite` backup API): `npm run backup:create`, `node bin/backup.mjs verify <path>`, `node bin/backup.mjs restore <path> <empty-dir>`. AES-256-GCM authenticated output; SHA-256 integrity, read-only SQLite PRAGMA integrity check; refuses symlinks and non-empty restore targets. It temporarily stages an unencrypted SQLite file on local disk during the online backup: protect the volume with filesystem encryption and secure access. **This does not encrypt the live SQLite database or prove disaster recovery**. External encrypted volume and KMS still needed.
2. **HTTP local defensive boundary:** only loopback client addresses, `Host` allowlist, rejection of foreign `Origin`, CSP script/style nonces, no `unsafe-inline`, `X-Frame-Options: DENY`. Does not mean suitable for public Internet or that an independent pen-test has happened.
3. **Durable synthetic-only queue:** `POST /v1/submissions/:id/queue` for local admin/sponsor, `GET /v1/queue` for admin/sponsor/auditor, `npm run queue:once`. SQLite lease+retry/idempotency and reserved per-tenant budget. Does not run untrusted project code. It is **not** a distributed HA queue; the worker is deliberately disabled without `AIFIRST_SYNTHETIC_DEMO=1`, an explicit Free model, a key, and a local admin token. A live provider call still requires G3-local review and verified AV from locally configured scanner; no customer data is allowed.
4. **OpenRouter metadata filter fixed:** internal fixed rule can say “employee” without falsely blocking the safe synthetic call; project names/file names/rubric remain scanned for sensitive markers. Real provider evaluation and contractual data terms still outstanding.
5. **Financial honesty:** manually entered bank references now mark invoices `PAYMENT_REFERENCE_UNVERIFIED` (not paid); only signed external statement import uses `BANK_STATEMENT_IMPORTED` (not proof of a live banking transaction). No bank payment or prize is executed. For Spain, see Agencia Tributaria SPFE 2026 and fiscal advisor for individual invoicing obligations.
6. **Deliverable contract parity:** CI-neutral Node test verifies the EX01–EX11 ID, name, format and audience match the original and current runtime. EX09 private feedback remains withheld. PDF/PPTX packages are drafts pending G6, never final invoices/approvals.

## Practical local commands

```bash
node --version                          # >=22.16.0
npm run test:pilot                      # existing pilot suite
npm run test:enterprise                 # existing 14 local tests
npm run test:hardening                  # new hardening/queue/API/provider tests
npm run verify:local                    # all repo suites + synthetic end-to-end

# Secrets must be set outside Git, not pasted into project documentation:
export AIFIRST_MASTER_KEY_B64='<32 random bytes encoded as base64>'
node bin/backup.mjs create
node bin/backup.mjs verify .aifirst-local/backups/<snapshot-id>.snapshot.aif1
node bin/backup.mjs restore .aifirst-local/backups/<snapshot-id>.snapshot.aif1 /tmp/aifirst-isolated-restore

# Synthetic trial only; never client files or employee details:
export AIFIRST_SYNTHETIC_DEMO=1
export AIFIRST_ALLOW_OPENROUTER_FREE=1
export OPENROUTER_API_KEY='<secret manager value>'
export AIFIRST_ADMIN_TOKEN='<local admin token; not Git>'
node bin/queue.mjs once
```

## What must be wired next, with external evidence

| Dependency | Real production acceptance | Owner | Status |
|---|---|---|---|
| OpenRouter Free | Actual account/key, live inference log with masked payload and real 429, accuracy/latency evals, provider data policy | AI owner + DPO | **EXTERNAL_NOT_TESTED** (synthetic only) |
| Entra/OIDC/MFA | Trusted JWKS, issuer/audience, group/role mapping, offboarding/revocation/pen test | IT security + client IdP admin | **EXTERNAL_NOT_TESTED** |
| Live DB encryption / KMS | Managed KMS/HSM, key rotation, encrypted volume/DB, backup retention, restore drills with RTO/RPO | Infrastructure + security | **PARTIAL_LOCAL_BACKUP_ONLY** |
| AV/DLP, file ingestion | Certified AV/DLP evidence for actual formats, safe Office/PDF parsing, quarantine retention, malware tests | Security + DPO | **EXTERNAL_NOT_TESTED** |
| Sandbox/workers | Real isolate, denied egress, CPU/RAM/timeout limits, proof of no cross-tenant execution, durable queue HA | Platform engineering | **SYNTHETIC_METADATA_QUEUE_ONLY** |
| Executive pack EX01–EX11 | Template approval, verifiable source claims, rights for EX09, human signature G6, standard interoperable encrypted export | Product/editorial + sponsor | **DRAFT_ONLY** |
| Fiscal invoices and ERP | Chosen tax-compliant platform/series/IVA, signed return receipts, tax advisor review | Finance + accountant | **EXTERNAL_NOT_TESTED** |
| Bank/PSP and prizes | Authorized API/statement chain, dual approval, KYC/payee validation, signed payouts, settlement, refunds | Treasury + legal | **NO_MONEY_MOVEMENT** |
| Gates G1–G7 | Signer legal power, approved procedures, vendor when legally needed, timestamps/appeals & evidence record | Legal + sponsor + independent juror | **EXTERNAL_NOT_TESTED** |
| Operations | Encrypted central audit log, disaster recovery, SLO dashboards, incident response, support and ownership | SRE + external auditor | **LOCAL_ONLY** |

Never close a production issue merely because a local adapter/test exists. The user has requested no Vercel deployments; none are required.
