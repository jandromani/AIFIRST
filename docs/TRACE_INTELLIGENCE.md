# AIFIRST · Trace Intelligence (local, metadata-only)

**Status:** operational private local import tested against a confidential corpus; no production SLA, no raw replay and no public data publication. No Docker required. Not a ranking of human workers or agent quality.

## Sources and safety boundary

Accepts exactly `runs.json` (array) and `events.jsonl` (one JSON object per line), matching the input structure produced by a trace extraction process. Expected keys: `run_id`, `system`, `event_count`, `metrics`, `trace_id`, `parent_run_id`, `event_type`, `timestamp`, `agent_id`, `span_id`, `parent_span_id`, `tool_name`, `status`, `observation` and `data_classification`. No clients or source repositories need to be connected.

**Confidential source data must remain on an authorized, encrypted local disk.** Live SQLite is not encrypted by this module. Files never leave the machine in this workflow. CLI refuses import unless acknowledged explicitly. No API accepts filesystem paths or raw event submissions. Never copy raw files into the public repo, issue comments, CI artifacts, Vercel or marketing pages.

### Private CLI

1. `node --version` (requires Node 22.16+); `npm run pilot:init -- "Laboratorio privado"` on a fresh checkout, if no admin token exists.
2. Set `AIFIRST_ADMIN_TOKEN` in your own local environment, without writing it into the repository.
3. Set `AIFIRST_ALLOW_CONFIDENTIAL_LOCAL_IMPORT=1` **after** confirming you are authorized and `.aifirst-local/` is on an encrypted private volume.
4. Run `npm run trace:import -- /absolute/path/runs.json /absolute/path/events.jsonl`.
5. Run `npm run trace:summary` and `npm run trace:candidates`.
6. `npm run pilot:serve` and open `http://127.0.0.1:4181/traces`.

Windows PowerShell example (placeholders, do NOT paste real secrets into chats):

```powershell
$env:AIFIRST_ADMIN_TOKEN = '<token-del-piloto-local>'
$env:AIFIRST_ALLOW_CONFIDENTIAL_LOCAL_IMPORT = '1'
npm run trace:import -- 'C:\\private\\runs.json' 'C:\\private\\events.jsonl'
npm run trace:summary
npm run pilot:serve
```

Import is atomic and idempotent by SHA-256 of both sources, bounded to a maximum of 1 million events by default and to an allowlist of known systems/classifications. Symlink inputs and duplicate run IDs are rejected; mismatched per-run event counts cause rollback.

## Persistence and minimization

- Source SHA-256 digests are stored locally for provenance and deduplication.
- Each run, trace, agent, span and parent identifier is pseudonymized using tenant-specific HMAC labels generated with a 32-byte local secret (`.aifirst-local/trace-intelligence.key`, mode `0600`). The key is not uploaded, logged or exposed through API.
- The SQLite DB contains run metadata, metrics, aggregate counts of all event types and observation classes, and a *sampled* non-content timeline. Keep all tool errors, terminal results, coordination events, first/last five and every 25th event in each run.
- Raw prompts, completions, tool arguments, input/output hashes, source evidence pointers, original agent IDs, file paths, and secrets are **never persisted in these new tables**.
- The event timeline is deliberately incomplete and **does not enable exact replay**.
- All API reads are tenant-scoped and require `admin`, `auditor` or `security` roles. The public static exporter uses an explanatory placeholder at `traces.html` and excludes telemetry and CLI credentials.

**Known limitation:** fields preserved for local analytics, such as started/ended times, system name, cohort counts and aggregated metadata, can still be sensitive and are not automatically anonymous under privacy law. Pseudonymization is not anonymization. Protect disk backups and permissions.

## API (loopback only)

- `GET /v1/traces/summary` — verified imported totals, systems, kinds, observations and sample size
- `GET /v1/traces/runs?limit=50&offset=0&system=codex` — pseudonymous runs with quality score always `null`
- `GET /v1/traces/runs/{alias}/events?limit=100` — representative timeline
- `GET /v1/traces/candidates?limit=30` — cases for **human evidence review**, with reason codes, never automatic promotions
- `GET /v1/traces/graph?limit=120` — parent relationships among the bounded run set

The API does not provide DELETE, remote imports or promotion endpoints. Critic candidates remain suggestions: hidden benchmark data, objective task outcomes, independent human reviewer and lawful disclosure are necessary before any competition or agent promotion. This makes Trace Intelligence usable alongside Agent Evolution OS without corrupting its gates.

## Independent source truth

The initial observed dataset contained 1,185 runs and 237,050 events. Import validation confirms exact event count parity. **`outcome:success` often means the agent completed/handed back a result, NOT that a customer outcome was independently verified.** `version_compare` means versions mentioned, not necessarily a controlled A/B comparison. `OBSERVED`/`DERIVED` are source-extractor classifications, not audit certifications. Monetary cost values were missing in the initial corpus. The module does not fabricate them.

## What is next

1. Collect 10 fully authorized and sanitized cases with task objectives and actual validation conditions outside the source ledger.
2. Establish a separate hidden holdout, not revealed to candidates.
3. Compare equal tasks with replayable fixtures before interpreting agent quality.
4. Have signed independent reviewers approve any policy adjustment or promotion; no raw confidential data reaches public critics.
5. Add schema-versioned import adapters for additional providers, sample rotation, retention/deletion controls and encrypted-at-rest storage.
