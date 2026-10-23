# AIFIRST Evidence Corpus v0.1 — private, auditable import

**Scope:** New private corpus index alongside the existing Trace Intelligence module. It is an *observability* dataset, not a hidden evaluation benchmark with certified ground truth. Agent Evolution OS must not use these records to promote agents automatically.

## Accepted files and trust

Input folder contains `10_PROVENANCE_MANIFEST.json`, `02_AGENT_CATALOG.json`, `04_RUNS.json`, `05_EVALUATIONS.json`, `12_QUALITY_REPORT.data.json`. Optionally also `03_TRACE_EVENTS.jsonl`. Imports validate SHA-256 against the manifest *before* committing any database rows. The optional JSONL must match exactly the manifest SHA, 24-field schema, run/source IDs, observed/derived classifications and the quality report's total. A user must **not** supply a previous version's `events.jsonl` as the new 03 event file.

**Source archive received 2026-10-23:** 22/23 listed files have matching SHA-256 in the container session (including 10 samples), `03_TRACE_EVENTS.jsonl` is absent. Therefore only 2,909 runs, 255 catalog entries, 7,592 evaluations and 105 source records have been imported here; **277,117 event rows have NOT been imported**, even though the quality report declares them. There is an older separate `events.jsonl` with 237,050 events in the conversation; it is not part of this version's manifest.

Sources and events remain local. The generated database is `.aifirst-local/pilot.sqlite` when using the pilot CLI. This is not encrypted SQLite: use a full-disk encrypted workspace, proper file permissions and an authorized operator. The CLI requires a private local admin token and an explicit acknowledgement. Avoid pasting tokens into chats or commands captured in shared shell history.

## CLI (Node >=22.16, initialized local pilot)

```powershell
npm run pilot:init -- "Empresa sintética"
$env:AIFIRST_ADMIN_TOKEN = "<token from private local initialization>"
$env:AIFIRST_ALLOW_CONFIDENTIAL_LOCAL_IMPORT = "1"
npm run corpus:import -- "C:\private\AIFIRST_AGENT_TRACE_EVIDENCE"
npm run corpus:summary
npm run corpus:runs
npm run pilot:serve
```

Open `http://127.0.0.1:4181/corpus` and connect with the *local* admin or auditor token. The API `GET /v1/corpus/summary`, `/runs`, `/evaluations` requires authentication and isolates each tenant. There is no import-by-HTTP route and no public/private-data export. The Vercel-static exporter replaces `/corpus` with an inert placeholder.

When the matching `03_TRACE_EVENTS.jsonl` is available, supply it as a second argument to `corpus:import`. The command performs SHA-256 and event-schema verification, stores **aggregate event counts only**, and never persists raw event bodies.

## Partition and release policy

- **Default:** ALL imported sources go to `arena`. Sources and runs are not returned to `study` readers or publicly served. This partition is *not* a genuine unseen benchmark: existing source cases are already known and seen during development. Treat as a **private reference corpus**.
- Study exposure requires a separate human authorization (`ackStudy`) and an explicit per-source mapping **at first import**. Imported source partitions are immutable; an attempted later reassignment is rejected, not silently overwritten.
- No prompt, model response, command, unmasked agent/source/run ID, detailed evidence reference, input/output HMAC, original filename/path, source free-form note, or secret is saved in the database or returned through the API. An independent tenant-scoped HMAC key produces aliases. The key has restrictive local filesystem permissions.
- This cannot independently reconstruct past LLM calls, certify model quality, rank employees, promote a model or establish independent human/LLM evaluation. The candidate arena requires NEW unseen tasks and a documented holdout split.

## Source quality reconciliation

The full (non-03) dataset contains anomalies discovered by this importer, which preserves all 7,592 entries without claiming they are 7,592 *independent* evaluations:

- 58 evaluations have no `run_id` resolvable against the 2,909-run index (many appear to be campaign/evaluation-level events).
- 162 evaluation records reuse a previously encountered `evaluation_id`/`eval_id` (can be different gate outcomes on the same identifier). We store a distinct per-row alias and mark repeated identifiers.
- 1 agent identifier occurs in two catalog entries (the catalog has 255 rows, 254 distinct identifiers). The cross-stage assignment needs manual lineage review, not accidental merging.

These anomalies are not **proof** that the original events are corrupt. Their meaning must be resolved at the source; never silently deduplicate judgments.

## Security operations

The uploaded `09_SECURITY_AND_PRIVACY.md` explicitly reports credentials exposed in earlier local artifacts, including API keys. Rotate affected OpenAI/OpenRouter keys and any other credentials confirmed exposed, review cloud keys and revoke unsafe sessions. Do not copy the security report to a public repository. Never upload private corpus JSON/JSONL, manifest source labels, screenshots containing tenant tokens, private SQLite DBs or keys to GitHub/Vercel.

## Acceptance

- Offline: exact file hashes; 2,909/255/7,592 imported, all 105 source memberships recorded, private-only default; anomalies preserved; idempotent import; corrupt data rolls back; immutable partition; no raw data in SQLite.
- Pending: new 03 JSONL SHA and 277,117 line validation; full repository integration tests; browser behavior on HTTP localhost; provenance of reviewer independence; source-authorized holdout split; objective quality and price comparisons.
