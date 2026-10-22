# QA report — Private Decision Theater receipts (2026-10-22)

## Source and test boundary

Baseline: AIFIRST GitHub `master` at `715dfd02c896b0fbf22c973389a3e57890aa9a4d` before this iteration. Local working tree is **partial**: historical full-repository artifacts such as `web/atlas.html` are not present. These QA numbers do **not** describe the full GitHub checkout.

Executed with Node v22.16.0, actual `node:sqlite`, local Node HTTP listener and filesystem. Test command:

```
node --test test/verified-theater.test.mjs test/decision-theater.test.mjs \
  test/public-preview.test.mjs test/runtime.test.mjs test/enterprise.test.mjs \
  test/hardening.test.mjs test/job-queue.test.mjs test/evolution*.test.mjs \
  test/local-stack*.test.mjs test/lab*.test.mjs
```

Result in local test log: **78/78 passed**. More specific suite for this feature: **13/13 passed**. Coverage: isolated synthetic Discovery+Evolution execution, unanimous DIOS vote, local independent arena, Ed25519 receipt integrity, tamper detection, admin vs auditor roles, cross-tenant 404, no synthetic mode failure, loopback auth and public-static redaction. **These tests use mock scanner and synthetic model results; no external trust attestation.**

Browser smoke: Chromium `page.set_content()` at 1440x900 and 390x844 renders the verifier panel without page errors or horizontal overflow. Authentication console panel similarly renders without page errors or overflow. WebCrypto is unavailable in the `about:blank`/`set_content()` origin; attempts to visit a simulated HTTPS URL were blocked by environment admin policy. Therefore **the browser's real Ed25519 import-and-verify flow has NOT been validated here**, even though the same signed message verifies in Node. Confirm under real `https:` or `http://127.0.0.1` on a developer workstation.

## Security / release checklist

| Control | Local result | Remaining external acceptance |
|---|---|---|
| Caller is authenticated admin | Tested | Corporate SSO/MFA signoff |
| Auditor read-only receipt | Tested | Authorized client auditing |
| Tenant scope | Tested, unrelated tenant gets 404 | Real multitenant pentest |
| No live provider or customer files | Code path synthetic only | Review of third-party processing |
| Receipt tamper detection | Ed25519 tests passed | Trusted timestamp, HSM/KMS, signer identity |
| Real engines used | Lab + evolution run with SQLite | Customer workload benchmarking |
| Scanner | Explicit synthetic mock | External certified scanner |
| Safety + human gate | Production_release=false | Independent audit and contracts |
| Complete browser validation | Static smoke only | Browser WebCrypto, axe/WCAG, Firefox/Safari, user testing |

No issues with production acceptance are closed based on this partial evidence. Do not claim client readiness or publish the private API.
