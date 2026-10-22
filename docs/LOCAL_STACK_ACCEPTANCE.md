# AIFIRST Local Lab — acceptance and scope

**Baseline:** Agent Evolution OS 0.3 + Discovery & Transformation, Node 22+, SQLite. This release adds a **lab stack definition** and fail-closed adapters. **No Docker images could be launched in the authoring environment**. Do not claim “100% ready”, “MFA configured”, “KMS-backed data”, “PostgreSQL migrated” or “sandbox certified”.

## Runbook

1. Generate separate local secrets (`openssl rand -hex 32`) for PostgreSQL, Keycloak, MinIO and OpenBao. Write them into `infra/.env.lab` copied from the example and keep it outside Git.
2. `docker compose --env-file infra/.env.lab -f infra/compose.local.yaml config --quiet` then `docker compose --env-file infra/.env.lab -f infra/compose.local.yaml up -d`. *Local lab only.* The Keycloak and OpenBao server commands are development-mode. The MinIO/ClamAV image tags must be resolved and pinned to their actual OCI digests on the operator's host.
3. `npm run lab:doctor`: checks TCP reachability on loopback only; green ports are **not** proof of authentication or usability.
4. `npm run lab:jwks`: downloads local Keycloak metadata and confirms trusted issuer/JWKS on 127.0.0.1:58080. Its file remains excluded from Git. Set `AIFIRST_OIDC_ISSUER=http://127.0.0.1:58080/realms/aifirst-lab`, `AIFIRST_OIDC_AUDIENCE=aifirst-local-console`, `AIFIRST_OIDC_JWKS_FILE` to generated file and `AIFIRST_REQUIRE_OIDC=1` *after* admin binds issuer/sub to existing local principal. Set up first account and TOTP in Keycloak console. This is not proof of production MFA or enterprise Entra integration.
5. ClamAV: `AIFIRST_ENABLE_CLAMD=1 AIFIRST_CLAMD_PORT=53310` selects the actual TCP daemon. Infected/error/timeout files do not become CLEAN. Use AV test fixtures only. ClamAV's local CLEAN is not a legally signed G3.
6. For S3, create a private bucket `aifirst-demo` with administrative tooling. Set `AIFIRST_S3_ENDPOINT=http://127.0.0.1:59000`, access/secret key and `AIFIRST_S3_BUCKET`. Encryption of the primary artifact occurs first with `AIFIRST_MASTER_KEY_B64`; the authenticated user with role `admin` or `security` may then call `POST /v1/artifacts/:id/replicate` to create an encrypted, tenant-prefixed *secondary* object. `GET /v1/stack/readiness` never exposes keys or reports external attestation. A missing S3 service leaves the original encrypted local artifact intact.
7. PostgreSQL is a **staged append-only audit target**, not the primary database. `npm install` to get optional `pg`; then set `AIFIRST_PG_URL=postgresql://aifirst:...@127.0.0.1:55432/aifirst` and `AIFIRST_RUN_PG_MIGRATION=1`; `npm run lab:pg:migrate`. For runtime RLS use a **separate non-owner, non-BYPASSRLS** role, not the migration owner. Full migration of SQLite tables/transactions and production row-level enforcement is still open.
8. OpenBao `bao server -dev` is ephemeral and unsafe for real master keys. The `baoTransit` adapter supports encrypt/decrypt with an explicitly installed Transit key and an account with that permission. Dev server does not persist keys across restart. No automatic key migration/rotation is claimed.
9. `sandboxArgs` builds a restrictive Docker command: network none, pinned-image digest, read-only mounts, no caps, no-new-privileges, nonroot UID, limits and timeout. `runSandbox` **refuses all execution** unless both `AIFIRST_ENABLE_UNTRUSTED_SANDBOX=1` and `AIFIRST_SYNTHETIC_DEMO=1`. This is not audited VM isolation. Never run customer code here; real isolation requires gVisor/Firecracker or independently verified equivalent and an escape assessment.
10. `npm run test:lab` and `python tools/lab_ui_smoke.py`. These test API paths, signatures, fake connector endpoints and static Chromium—not actual Docker image startup.

## Strictly evidenced progress

| Capability | What is executable locally without providers | Still missing to say 100% |
|---|---|---|
| Identity | Keycloak realm import config, JWK pinning, OIDC verifier/bindings already in API | Real Keycloak boot/PKCE browser journey/MFA check, rotation/revocation, enterprise SSO |
| Key management | OpenBao Transit HTTP adapter with tests; local AES-GCM artifact encryption | Durable OpenBao/KMS, key management and rotation, live DB encryption |
| Database | SQL migrations with RLS and transaction tests | PostgreSQL migration of primary domain tables, backups/HA and real PG tests |
| Files | S3 SigV4, tenant-prefixed encrypted replica, idempotent receipt | Real S3 startup, credential scope, storage encryption/service access policies, backups/retention |
| Security | ClamAV daemon INSTREAM connector and existing sensitive-data heuristic | Real malware/PII test corpus, parser sandbox, DLP, review/pentest |
| Sandbox | Argument-level hardened OCI policy, explicit lab-only runner | Docker available, rootless engine, adversarial escape testing and independent review |
| Agents/swarm | Already wired in EvolutionOS/EvolutionFabric with approved synthetic adapters | Production-verified model providers, real evaluation benchmarks and cost/quality audits |
| Queue | SQLite persistent synthetic-only workers | Distributed HA / crash consistency drills |
| Jury | Existing local reviewer and cryptographic reviews with gate checks | Legally verified authority, revocation, end-user jury UI |
| 11 EX | Existing draft renderers and private encrypted archives | Real data-source review, secure recipient delivery, G6 acceptance |
| CRM | Existing lead registry and local APIs | Marketing consent, delivery channels, qualification/analytics |
| UX | Static Chromium smoke, baseline UX tests | Full browser E2E, axe/Lighthouse, WCAG 2.2 AA manual, moderated user research |

## Agent Evolution constitutional guarantees

The local stack does **not** supersede the Agent Evolution OS hard boundaries: mirrors remain independent; GOD criticism is private; unanimous signed belief changes require the frozen eligible roster; candidate promotion uses independent benchmarks and approval with rollback. Neither a Keycloak role nor an OpenBao token can authorize model self-promotion, external payments or legal acceptance alone.

No finance/bank provider is needed for a synthetic product demonstration. If customer data or commercial transactions are introduced, sign-off and fiscal/legal requirements must be assessed separately.
