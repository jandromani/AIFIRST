# Agent Evolution OS · Historical Acceptance v0.1

## Purpose

Turn authorized, pseudonymized **historical metadata** into ten *governance-policy regression cases*. This is not re-execution of a model, independent red-team validation, production accreditation, an agent-quality leaderboard or automatic promotion.

The private corpus has 2,909 indexed runs, 7,592 evaluation records and metadata for 255 entries in the agent catalog. A separate, later `03_TRACE_EVENTS.jsonl` with 277,117 records has **not** been supplied here; this feature does not pretend it has been imported. The ten exported historical case files are individually checked against `10_PROVENANCE_MANIFEST.json`.

## Install/run (local only)

Requirements: Node >=22.16, a local initialized pilot, an encrypted disk and explicit authorization to process the data. Put the ten S01–S08/S10/S11 JSON files in the `SAMPLES/` directory **with their original filenames** in the private evidence folder. The manifest sits one level above it. Never commit/upload this folder, the HMAC key or any customer data.

```powershell
npm run test:history
$env:AIFIRST_ADMIN_TOKEN = '<local pilot admin token>'
$env:AIFIRST_ALLOW_CONFIDENTIAL_LOCAL_IMPORT = '1'
npm run history:import -- 'C:\path\AIFIRST_AGENT_TRACE_EVIDENCE'
npm run history:list
npm run history:case -- S04
npm run pilot:serve
```

Open `http://127.0.0.1:4181/history` and authenticate locally with an admin, auditor or security token. All `/v1/history/*` operations are **GET-only**. Import is CLI-only and admin-only. By default the system serves localhost and never exports the history dashboard in the static preview.

## Rules and expected interpretation

| Case | Acceptance assertion | Honest conclusion |
|---|---|---|
| S01 | Recorded review chain with several runs and review evaluations | Review chain observed; independence not established |
| S02 | Failed first attempt, later completed attempt, retry flag | Recovery observed; no version advancement |
| S03 | Task failure despite passing tests | Failure must override green tests |
| S04 | Boundary violation despite successful turn state | Security hold, no promotion |
| S05 | `NOT READY` gate exists | A gate must block release |
| S06 | Prior `NOT READY`, then `READY`, `DONE`, `ARCHIVE` | Remediation documented, but tuned to prior feedback |
| S07 | Adversarial `HOLD` with findings | Block until independently resolved |
| S08 | `provider_timeout` recovered in controlled run | Injected test, not field reliability |
| S10 | The original judge rejected every case | Judge needs calibration; not evidence that all candidates are bad |
| S11 | A/B scores exist with two variants | Internal heuristic cannot support promotion |

**All cases have `promote_allowed:false` and `BLOCKED_NO_INDEPENDENT_BENCHMARK`.** The lab only checks that available evidence is consistent with the expected *historical* policy outcome. Passing assertions does not validate the originality or merits of the content.

## Security boundary

- Checks SHA-256 of every sample against the provided manifest **before any database write**. Uses SQLite transaction; a mismatch aborts the import.
- Exact allowlist of ten sample IDs. Refuses unauthorized classification or `SYNTHETIC` data in production imports; test fixtures can opt into `allowSynthetic` in a local unit-test helper only.
- No prompts, response bodies, source paths, source identifiers, content HMACs, raw review notes or free-form agent text are imported.
- Summaries are tenant-scoped and role-restricted; `GET /v1/history/cases` cannot read another tenant's records. CLI credentials stay in environment, no browser storage.
- The casebook is not a recruitment/employment ranking and is not accessible in the public static export.
- Data are subject to local SQLite filesystem security and volume encryption; these controls do not replace a production security review.

## Further acceptance gates

1. Build a new *hidden* dataset with task inputs, initial repository state, independent rubrics and expected outcomes; isolate it from candidate agents.
2. Enforce independent judge identities and separate model/provider families where feasible; measure agreement and disagreements.
3. Record versions, per-run costs, budgets, meaningful outcomes and all human approvals.
4. Demonstrate actual rollback after canary failure with real execution evidence.
5. Verify one-command infrastructure and browser E2E on a host with Docker, and external security/accessibility reviews.

See `docs/EVIDENCE_CORPUS.md`, `docs/EVIDENCE_CORPUS_QA.md`, `docs/REPLAY_STUDIO.md` and `docs/HISTORICAL_ACCEPTANCE_QA.md`.
