# AIFIRST local services — not production

This configuration is for **synthetic data, loopback and local development only**. `docker compose` must be installed separately. It was not available in the build environment, so real container startup is unverified.

1. Copy `.env.lab.example` to `.env.lab` and use distinct random secrets. Never commit `.env.lab` or real tenant files.
2. Run `docker compose --env-file infra/.env.lab -f infra/compose.local.yaml config --quiet`.
3. Run `docker compose --env-file infra/.env.lab -f infra/compose.local.yaml up -d`.
4. Verify localhost Keycloak 58080, PostgreSQL 55432, object storage 59000/59001, OpenBao 58200, ClamAV 53310. Use `node bin/local-stack.mjs doctor` to probe and report readiness.
5. For OIDC, create a local user in `aifirst-lab`, complete OTP setup, obtain an OIDC token through PKCE and bind that *verified* issuer+subject to an existing AIFIRST principal using its admin workflow. JWKS needs to be explicitly pinned; call `node bin/local-stack.mjs sync-jwks` after reviewing the issuer. Enabling SSO does **not** automatically create AIFIRST tenants.
6. OpenBao `-dev` is temporary and loses all keys on restart; never use to encrypt real material. Keycloak `start-dev` also uses insecure development defaults.
7. Object store image tags and OCI registries change; verify the configured image's provenance, checksum and legal availability before startup. A missing image is an **environment failure**, not evidence of product readiness.

`postgres` is currently a planned persistent **secondary** adapter/migration target; `EditionRuntime` and EvolutionOS remain on SQLite. A true transactional migration, failover and backup drills are not yet complete.

**Never publish these ports, expose Docker daemon remotely, or run untrusted code without a separately attested hardened sandbox.**
