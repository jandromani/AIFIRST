# AIFIRST · One-command synthetic integration lab

**Status: code verified locally; full Docker stack NOT verified in our build environment (Docker unavailable).** No external accounts, Stripe, bank, registered company or real customer information are used. This is an experimental local demonstration, **not production**.

## The exact one-command workflow

Prerequisites: Node.js >=22.16, Docker Engine + recent Docker Compose v2, Python 3. The machine needs network access to pull lab container images; pip may download ReportLab/python-pptx into a dedicated virtual environment. No Vercel or paid cloud deployment.

```bash
npm run lab:full
```

The command:

1. Creates strong random lab secrets on first run in `.aifirst-local/one-command/.env.lab` and an AES-256 local master key in `.aifirst-local/one-command/master.key` (0600 on Unix). Secrets are never printed, committed or sent to model providers. Repeated invocations re-use those secrets; do not reset volumes while keeping stale secrets.
2. Validates and starts `infra/compose.local.yaml` with **Keycloak, PostgreSQL, MinIO-compatible S3, OpenBao and ClamAV** on `127.0.0.1` ports only. A missing Docker binary fails the command; services are **not** replaced with mocks.
3. Uses the Keycloak admin bootstrap **only in this lab** to create or reuse a confidential service account (scoped synthetic OIDC). Retrieves its JWT, verifies trusted JWKS, issuer, explicit client audience and signed token. The dev HTTP issuer exception is pinned to exact `http://127.0.0.1:58080/realms/aifirst-lab`; remote HTTP OIDC remains forbidden. This proves service identity **not a human MFA interaction**.
4. Boots OpenBao Transit with a **dev-only ephemeral key** and tests an actual encrypt/decrypt roundtrip. Does not make OpenBao the primary key store and does not claim durable KMS.
5. Creates a new private demo S3 bucket; scans a benign fixture using ClamAV `INSTREAM`; applies PostgreSQL **secondary audit schema** migrations. SQLite remains transactional source of truth and PG superuser access does not certify row-level security isolation.
6. Creates a synthetic company, edition, participant alias, submission and AES-256-GCM encrypted artifact, replicates the ciphertext to S3 and verifies a byte-level download. Validates real OIDC on the authenticated local API.
7. Records **local-only** G3 and G4 reviews, has an independent juror review evidence, defines three organizational scenarios and connects metadata to Evolution OS. Executes its productive agent, signed mirror, candidate application, hidden benchmark, human-gated canary and improvement proposal; checks the hash-chain ledger.
8. Renders the original eleven EX draft files using Python, wraps ZIP in AES-GCM and writes a signed-by-no-one proof JSON at `.aifirst-local/one-command/proof.json` with `production_ready:false`. Neither legal gates nor financial transfers are invented.
9. Starts the local product web at `http://127.0.0.1:4181/` with `/console`, `/evolution`, `/atlas`, and `/lab`. `/lab` loads the persisted **tenant-scoped** proof only with the lab administrator bearer token. The token is in the protected `local-admin.token` file inside the generated run directory; it is not logged or persisted in the browser.

Stop the web with Ctrl+C. The lab containers remain local and can be stopped with `npm run lab:stop` (volumes and keys retained). Removing local volumes or rotating secrets requires an explicit disaster-recovery plan; the automation deliberately does not delete data or issue a destructive reset.

## Useful additional commands

```bash
npm run lab:init              # generate local secrets only
npm run lab:verify            # Docker + integration + report proof; exit when complete
npm run lab:offline-proof     # mock-AV isolated unit proof WITHOUT Docker, marked as such
npm run test:lab:integrated   # regression tests incl. real Node + SQLite
npm run lab:doctor            # TCP reachability only, NOT authentication
npm run lab:stop              # stops containers; does not delete volumes
```

## What the proof does NOT certify

- OpenRouter: without an authorized API key, the swarm runs a deterministic synthetic adapter. **No claim of live external inference**.
- Human MFA: Keycloak service-account authentication is not a human challenge/OTP demonstration. Interactive employee login and lifecycle remain separate tasks.
- Security: Keycloak `start-dev`, OpenBao `-dev`, local Docker and a basic scanner are not production IAM, HSM, DLP or sandbox penetration-test evidence. This command does **not run arbitrary submitted code**.
- PostgreSQL: only the audit schema is migrated; SQLite remains the main operational DB, and no HA/RLS external audit is claimed.
- Approvals: G3/G4 are local pilot reviews; G1/G5/G6/G7 remain unsigned and blocked. Candidate promotions are local canaries approved by a separate auditor principal.
- Reports: all 11 EX are synthetic **drafts**, ZIP uses AIF1 envelope and requires the AIFIRST decrypt tool; distribution remains restricted.
- Finance: no invoices submitted, no bank connections, no fiscal authorization, no cash movement or real prizes.

A failure during the live run exits nonzero, retains the already-started local containers for diagnosis and **does not write a new success proof**. Readiness is computed from service API responses, not merely open TCP ports. Initial image availability depends on your local Docker installation and OCI registries; the image versions in Compose need operator review before any other environment.
