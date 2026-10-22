# AIFIRST · Public Decision Theater ↔ Private Execution Proofs

## What is actually connected

- `/demo` remains a zero-credential, zero-network, static decision simulator: ranking, arena and DIOS browser-side scenarios.
- `/console` → Diagnostics, using a **local authenticated admin**, can call `POST /v1/theater/proofs` to invoke real Node `EditionRuntime`, `EnterpriseOps`, `EvolutionOS`, `EvolutionFabric` and `demoScenario`. The action requires `AIFIRST_SYNTHETIC_DEMO=1` and explicit acknowledgement. Each invocation creates *new isolated synthetic cases*. No uploaded client data or existing user data is passed into these fixtures.
- Discovery execution checks a SHA-256 artifact through a **mock scanner**, applies G3/G4 *local* reviews, creates three scenarios and checks all eleven canonical EX contracts.
- Evolution runs a hidden synthetic arena, a gated promotion and hash-chained event audit. A second independent evolution fixture uses real Ed25519 ballots for *all active agents* plus a distinct auditor gate for replacing DIOS. This is local simulated governance, not legal signoff.
- `VerifiedTheater` creates a tenant-scoped SQLite run record and signs a JSON payload using an Ed25519 key stored under `.aifirst-local/proof-signing/` with permission 0600. No runtime keys leave disk. The signed JSON includes a key fingerprint and public key, but no bearer token, source document or worker identity.
- `/demo#private-verify` offers an offline WebCrypto integrity check. **Self-contained signatures are not sufficient proof of publisher identity**; the browser only marks the local issuer recognized if the SHA-256 SPKI fingerprint is explicitly pinned from a separate trusted channel.
- `GET /v1/theater/proofs`, `/v1/theater/proofs/{uuid}` and `/v1/theater/proofs/signer` require authenticated admin or auditor and enforce tenant scope. At most five runs per tenant per UTC date and one in-flight run per tenant.
- No OpenRouter, Keycloak, Docker, ERP, bank, email, or untrusted code are invoked. No outgoing Internet request is necessary. JavaScript from uploaded submissions is never executed.

## Commands

```bash
npm run pilot:init -- "Synthetic company"
# Set AIFIRST_SYNTHETIC_DEMO=1 and AIFIRST_ADMIN_TOKEN (keep tokens out of Git)
npm run theater:proof
npm run theater:verify -- .aifirst-local/receipts/<run-id>.json
npm run test:theater:verified
```

The private proof is not a re-evaluation of the **same settings** selected in the browser. It certifies that *this deployed local code was able to perform a separate fixed synthetic run* covering the corresponding business capabilities. Do not compare the public simulator score to the proof as though both shared the same fixture.

## Limits

- The scanner is a TEST DOUBLE. The test agents use deterministic, synthetic outcomes. A valid signature is **not** a customer benchmark, security certificate, qualified electronic signature, external audit, trusted timestamp or authorization of gates G1–G7.
- Local signing keys are stored on the development machine, not KMS/HSM. Compromise or replacement of this key invalidates any identity inference until an out-of-band trust anchor is established. Old receipts remain cryptographically verifiable using their embedded public key, but identity trust must be separately documented.
- Public deployments **must never** expose the private API, bearer tokens, SQLite or the signing key. This workflow remains behind the loopback API. No Vercel deployment created.
- Offline browser verification needs WebCrypto Ed25519 support in a secure context; if unavailable the UI refuses to claim success.
- This is not a complete audit trail attestation over every input byte; a local execution summary includes a source-trace hash and unverified simulated scanner references. More rigorous signed artifact manifests, KMS, external timestamps and reproducible replay are future release work.

## Tests

`test/verified-theater.test.mjs`: signature validity and tampering, three engine stages, correct tenant filtering, auth, explicit synthetic gate, scope and trusted key fingerprint. `test/decision-theater.test.mjs` checks that static export remains unauthenticated and private routes are not bundled.
