# Replay Studio — release gate and proof record

Date: 2026-10-22. Source under `web/replay-core.mjs`, `src/replay-studio.mjs`, `web/replay.html`.

## Evidence from this iteration (container checkout, Node v22.16.0)

- `npm run test:replay`: **8/8 passed**: reference parity, safety exclusions, vote veto, allowed input schema, signed local receipts, cross-tenant boundaries, daily cap, authenticated HTTP, CSP-safe public page, portable static build and CLI proof.
- Expanded selected Node regression: **79/79 passed** across runtime, enterprise, hardening, queue, OpenRouter mock, Evolution OS, lab bootstrap, theater, public-preview and replay.
- Chromium rendered **1440×900, 390×844 and 320×740** from the compiled static HTML via Playwright `set_content`; no JavaScript errors or horizontal overflow; budget 50 → 20 changed eligible projects 7 → 1; one veto blocked amendment; all six trace items shown.
- Public build: `npm run preview:build` — self-contained `replay.html` with exact kernel inlined and read-only preview controls.
- `npm run replay:bridge` returned a signed replay of the public reference fixture in a throwaway SQLite environment; key identity remains untrusted without independent pinning.
- Existing CSP contract initially failed when `script-src` ordering changed, then was repaired while preserving the `nonce`, `self` for the local public kernel module, and rejecting `unsafe-inline`.

## Important NOT TESTED / NOT CLAIMED

- **Full GitHub checkout suite** and rebuilt Atlas: the local checkout was partial. Selected 79 Node tests do not equal `npm test` for all repository files.
- Browser's actual Ed25519/WebCrypto verifier **on HTTPS or localhost with secure origin**: Playwright navigation was blocked in this environment; the static render was `about:blank` (WebCrypto SubtleCrypto unavailable). Node verifies the same signature independently.
- Actual SSO/MFA, KMS, database migration, DLP/ClamAV real daemon, untrusted-code sandbox, external LLM availability, independent juror/qualified signatures, finance, Docker Compose, end-user WCAG audit.
- Browser reference fixtures are **public**. No hidden challenge, independent oracle, adaptive real model run, true canary, or external production release occurred.
- GitHub Actions workflow is provided, but its remote run is not proven by local execution.

## Acceptance policy

Replay parity may be labeled `LOCAL_TESTED`, not `PRODUCTION_VERIFIED`. No pre-existing P0 enterprise issues should be closed for this reason. Browser verification must additionally compare the signed key fingerprint with a trusted key learned outside the receipt.
