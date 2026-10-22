# Local stack iteration — QA evidence (2026-10-22)

## Verified in actual Node 22.16.0 runtime
- **52/52 Node tests PASS** in selected runtime, enterprise, hardening, job queue, OpenRouter HTTP mock, Evolution OS, bridge, fabric HTTP and 8 new lab adapter/API tests.
- JSON syntax: Keycloak realm valid. YAML parser: all five local Compose services and local ports structurally valid.
- `web/pilot.html`: inline JS compiled via Node VM; lab readiness display present. No remote scripts/assets added.
- New negative tests: cross-tenant encrypted replica denied; S3 ciphertext only and SigV4 headers; dangerous S3 paths rejected; OpenBao refuses untrusted HTTP endpoints; infected ClamAV fake daemon; unavailable scanner fails closed; unauthorized HTTP readiness returns 401/403; sandbox disabled by default and pinned digest required.

## Not verified
- No Docker binary was available; containers **were not started**. The Compose images/tags, Keycloak realm import, Postgres RLS under a real nonowner DB account, MinIO write/read, OpenBao real Transit key and real ClamAV signatures have not been tested against live services.
- An attempted static Chromium smoke could not run: Playwright's bundled browser was absent and system Chromium launch hung. This is *not* a passed browser/UI regression.
- No OpenRouter API key/live requests, KMS, payment, enterprise signatures, formal DLP/pentest, or external authorized tenant data were used.
- The old repository's `catalog/`/`web/atlas.html` files were not present in the local partial workspace; the entire historical `npm test` suite has not been executed here. Earlier documented claims of complete integration testing should not be extended to this release.

## Strict states
- `LAB_CODE_TESTED`: new local adapters + SQLite persistence + fake-protocol tests.
- `SERVICE_STARTED_AND_VERIFIED`: **false**, pending `docker compose` on an operator machine.
- `CUSTOMER_PRODUCTION_VERIFIED`: **false** and explicitly blocked.

Full reproduction: `npm run test:lab`; broader available subset described above; `docker compose --env-file infra/.env.lab -f infra/compose.local.yaml up -d` requires real secrets and Docker installed locally.
