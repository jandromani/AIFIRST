# AIFIRST / Replay Studio — Same scenario, same result

**Status:** local deterministic reference kernel; synthetic fixtures and public case answers. Not an agent benchmark, enterprise attestation, or production approval.

## What was implemented

1. **Single portable replay kernel** (`web/replay-core.mjs`) imported by both browser and Node. Inputs are explicitly bounded and allowlisted; arbitrary text, URLs, PII, fields or executable payloads are not permitted.
2. **Evidence-to-decision experience** (`web/replay.html`) with ten fictitious projects, scored and excluded through transparent rules; six public arena cases; five-voter DIOS simulation; step-level trace.
3. **Authenticated tenant-bound local replay** (`src/replay-studio.mjs`) at `POST /v1/replay/runs`, persisted per tenant, max 20/day, roles `admin`/`sponsor`, behind `AIFIRST_SYNTHETIC_DEMO=1`.
4. **Ed25519 signed receipt**, reusing the existing per-installation local signer; contains scenario/output SHA-256, kernel ID and honest limitations. GET `/v1/replay/runs` for admin/sponsor/auditor, GET `/v1/replay/runs/:id` tenant-scoped.
5. **Verification** recomputes the output from the receipt input and compares hashes, then verifies the signature; browser verifies with WebCrypto, Node with `verifyReplayReceipt`.
6. **Static output** `npm run preview:build` inlines the exact same kernel into the public HTML (no CDN, service worker, API key or external fetch). Public HTML is a simulation and never includes credentials.

## Try without Docker

```bash
npm run test:replay
npm run replay:proof > artifacts/replay-example.json
npm run preview:build
# Open dist-preview/replay.html (offline) or use a static HTTP server.
```

## Real private local receipt

```bash
npm run pilot:init -- 'Synthetic company'
AIFIRST_SYNTHETIC_DEMO=1 npm run pilot:serve
# Authorized caller, with its private local token (never put in public JS):
# POST /v1/replay/runs using Content-Type: application/json and the exported scenario JSON.
# Download the returned receipt; import it under "Verifica un recibo" in replay.html.
```

### Trust model

- **Reproducibility:** browser/Node parity of a *public reference algorithm*, not an LLM or hidden benchmark.
- **Cryptographic integrity:** Ed25519 signatures and SHA-256, not third-party certification.
- **Identity:** the public key accompanies the signed receipt; compare its fingerprint with a separately trusted key to establish issuer identity. A self-signed receipt alone has no trusted origin.
- **No automatic deployment:** an eligible simulated canary is never promoted into the live agent system; real EvolutionOS gates are separate.
- **No employees or clients:** fixtures describe fictitious project proposals; `P09` is intentionally blocked because employee profiling is outside the allowed purpose.
- **No production release, bank payments, legal signatures, model calls, external data or Docker.**

## Limitations and next acceptance gates

Private receipts should eventually reference immutable `EvolutionOS` event IDs and independently hidden benchmarks; this iteration exercises only the public reference kernel with Node parity. For true third-party evidence use independent signer identity, maintained key rotation, immutable storage, additional judges, isolated execution, and authorized client data. Do not infer compliance from a passing deterministic fixture.
