# Gap register · Auditoría de fases A–E

| Fase | Entregado como código ejecutable y probado | Depende de proveedor/cliente (NO resuelto) |
|---|---|---|
| A | 7 pruebas Node sobre SQLite, API real local; consola renderizada | Ejecutar tests completos previos y seguridad/browsers con checkout |
| B | Tenant, bearer token por rol, intake, hash SHA256, cuarentena, scanner ClamAV opcional | SSO, AV/PII/secretos homologados, cifrado, red corporativa, DPIA y G3 real |
| C | Adapter HTTPS modelo configurable, topes por llamada estimados, traza SQLite, jurado independiente local | Credenciales/modelo autorizados, gateway real, presupuesto facturado, sandbox, colas durables, G4 real |
| D | 11 EX originales con audiencia/formatos, JSON verificable, 3 escenarios, grafo simple | Render PDF/PPTX/ZIP, ACL por dato, gráfos temporales, informes finales firmados |
| E | Leads, contratos pendientes, facturas borrador, registro manual banco, premios/jurados pendientes | ERP fiscal, banco/TPV, pagos reales, anticipo, invoice numbering legal, conciliación externa |

**Gates:** solo revisión local G0/G2/G3/G4; G1/G5/G6/G7 bloqueados explícitamente. No hay autorización externa para clientes reales.

## 2026-10-22 — OpenRouter + enterprise controls added

| Topic | Now implemented and locally tested | Still external / NOT proven |
|---|---|---|
| OpenRouter Free | Fixed OpenRouter endpoint, allowlisted free models, key in env, synthetic-only metadata, 12/day account budget; mock HTTP tested | Actual API key, live free-model response, uptime, provider DPA and EU residency (Free does not offer EU-only routing) |
| OIDC SSO | RS256 / ES256 JWT verifier against pinned JWKS, issuer+aud+exp+iat checks, admin tenant-subject binding | Customer IdP enrollment/MFA/groups, revocation/session hardening and independent pentest |
| Encryption | AES-256-GCM/HKDF per tenant/artifact, integrity checks, encrypted upload route | SQLite metadata encryption, KMS/HSM/rotation, encrypted backups, DR proof |
| Scanning | Optional ClamAV and restricted heuristic PII/secret check | Enterprise AV/DLP, parser sandbox, independent G3 attestation, risk of false negatives |
| Isolation | Explicit denial of untrusted execution, tenant RBAC | Real sandbox executor, no-network worker architecture and security audit |
| Signatures | OIDC-bound Ed25519 approval payload signature verification | Qualified trust service, signed contracts, external authority/SoW and release attestation |
| AI | OpenRouter request contract and tests with fake API HTTP | Actual inference account, eval data, model stability, measured time/cost and SLA |
| Reports | Real PDF/PPTX/CSV/JSON EX01–EX11 drafts; encrypted ZIP archive; plaintext not exported by default | Professional templates, checked content/source evidence, EX09 private authorization, approved EX11 exit pack and G6 signoff |
| ERP & bank | HTTPS ERP draft submission; signed statement import; payouts batch awaiting approval | ERP tax compliance, live banking/PSD2 or bank signing identity, SEPA payouts, bank reconciliation against bank API and invoices legally issued |
| Verification | 14/14 tests in Node 22.16 + PDF/PPTX file inspection; PDF visual render checked | Full historical test suite `npm run verify:local` on complete checkout, E2E cloud, external providers and data-protection review |

**No deployed production system, customer bank transfer, qualified e-signature, external security attestation, or confirmed real OpenRouter inference.**
