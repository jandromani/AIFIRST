# AIFIRST · One-command lab release QA · 2026-10-22

## Evidence actually executed

- Node.js v22.16.0, real `node:sqlite`, filesystem and loopback HTTP.
- `npm run test:lab:integrated`: **14/14** tests passing for credential generation and Unix file permissions, symlink rejection, whitelisted Compose exec, Docker unavailable failure, local HTTP OIDC issuer exception, retry boundedness, OpenBao mock protocol responses, real local SQLite synthetic flow, encrypted upload, independent juror/mirror/arena/canary, 3 scenarios, **11 actual report assets and encrypted ZIP**, fail-closed without a scanner, authenticated private lab proof route and tenant/role isolation.
- `npm run lab:offline-proof`: completed with **explicit mock antivirus** and clear `OFFLINE_MOCK_SCAN_TEST_NOT_DOCKER` flag. No live OpenRouter calls or production gate approvals.
- Expanded Node regression, 73 cases attempted, **71 pass, 2 blocked by absent historical files in the partial local checkout** (`web/atlas.html` and `catalog/original-deliverables.json`). Both original files exist in GitHub `master`; this commit does not modify or fabricate them. This is **not** a full-repo 73/73 success claim.
- `npm run lab:verify`: **fails closed** with `Docker Compose config failed: ENOENT`, because Docker is not installed in this build environment. It does not create a successful integration proof, open services or falsely report readiness.
- Static code syntax (`node --check`) checked. Headless Chromium could not launch because the installed Playwright package had no matching headless browser binary. **No verified visual/browser regression in this iteration**.

## Unverified operational acceptance

1. Docker image pull/health and all five services running simultaneously in the operator environment.
2. Keycloak real service-account token issuance, audience mapper and JWKS; interactive human MFA remains untested even after lab service token passes.
3. OpenBao actual dev Transit key create/read and cryptographic roundtrip; S3 SigV4 against actual MinIO; ClamAV actual daemon scan; PostgreSQL migrations.
4. Full end-to-end run with live **local** services including ciphertext S3 download and authenticated HTTP call using a Keycloak-issued JWT.
5. Customer legal/privacy sign-offs, KMS durability, real database migration, external penetration test, OpenRouter own key, financial accounts, model evals and recovery/HA.

## Pass/fail interpretation

Only a run that has executed `npm run lab:verify` or `npm run lab:full` **with all service checks** and has written `.aifirst-local/one-command/proof.json` can claim `LOCAL_DOCKER_SERVICE_PROOF`. That record always has `production_ready:false`. `lab:offline-proof` does not create that record and is not eligible to greenlight service status. The API `/v1/lab/proof` checks bearer role and tenant and refuses to synthesize missing evidence.
