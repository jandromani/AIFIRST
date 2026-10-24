# Independent Arena · shadow-only acceptance engine

Status: LOCAL_SYNTHETIC_TESTED. Node 22.16+, no Docker / paid service. NOT a blind benchmark of real LLMs.

## What it does

- Prospective fixtures contain at least 8 distinct cases, with at least one mandatory safety case.
- The evaluator holds private expected answers and hard-safety flags in memory. The incumbent and candidate receive the **same task** but never the reference answer or the evaluation rubric's hidden expected value.
- Neither run can mutate the other. The executor is a **trusted adapter supplied locally**; arbitrary applicant code cannot be executed through the HTTP API.
- Only registered productive `ACTIVE` and candidate `CANDIDATE` agents can enter a round. They must belong to the same tenant.
- The auditor/security reviewer is a separate, active principal whose Ed25519 public key is registered and pinned beforehand, and cannot be replaced without explicit future rotation support.
- Each signed verdict is checked both cryptographically and against the synthetic **exact-match** answer and safety oracle. A judge's signature **alone** cannot override a deterministic failed case.
- A SHA-256 fingerprint of `case.task` previously marked `study` blocks its use in `arena`. This is a local contamination check, **not** proof that a language model never saw a task elsewhere.
- No expected answers, raw candidate answers, original customer traces or credentials are persisted. SQLite saves aggregate counts, hashes, provenance and the signing-key fingerprint.
- A tamper-evident per-tenant chain links each stored report. Corruption of stored summary, decision, metadata or a chained hash fails the local audit.

## Gates

`BLOCK_SAFETY` > `INSUFFICIENT_COST_EVIDENCE` > retain on cost/latency regression > paired improvement evaluation. With at least 8 cases, candidate must have 2+ paired wins, 0 paired losses, and an absolute pass-rate improvement of at least 10 points, while cost and latency stay within 115% / 125% of incumbent. `RECOMMEND_INDEPENDENT_HUMAN_REVIEW` is **not** production permission; no `evo_promotions` records are created or mutated.

The model does not estimate statistical significance or handle stochastic model variance; one synthetic round cannot establish generalization. The judge's local cryptographic identity is not third-party attestation. Future versions need independent processes, hidden external challenge store, model sandbox, dataset provenance, statistical uncertainty, stable cost accounting and a tested production canary+rollback.

## Commands and endpoints

```bash
npm run test:arena
npm run arena:demo
npm run pilot:serve
```

Open `http://127.0.0.1:4181/arena`. Give the private local token printed by `arena:demo`. Tokens are kept only in page memory (not persistent storage). The private API supports `GET /v1/arena/runs`, `GET /v1/arena/runs/:id` and `GET /v1/arena/audit`, all tenant-authenticated and read-only. The CLI creates a unique synthetic tenant and judge for each run and stores evidence in gitignored `.aifirst-local/`.

The static export replaces `/arena` with a private-boundary placeholder. Neither hidden fixtures nor local results are copied to Vercel or GitHub. The historical S01–S11 cases informed the gate design; **none** of the confidential historical inputs or their expected outcomes have been inserted into this public harness.
