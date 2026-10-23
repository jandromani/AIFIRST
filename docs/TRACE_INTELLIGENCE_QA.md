# Trace Intelligence QA · October 2026

Local Node.js 22.16 and SQLite experimental runtime used. The real data belongs to the user and was never sent to GitHub.

## Checks

- Import real `runs.json` / `events.jsonl`, JSONL streaming: **1,185 runs, 237,050 events**, 0 dropped, per-run parity checked.
- Observations: **159,021 OBSERVED; 78,029 DERIVED** (source labels, not independent adjudication).
- Systems: Codex 758 runs; Claude Code 383; VS Code Copilot 25; Copilot CLI 19.
- Local import time measured at approximately **14.2 seconds** for 183 MB JSONL on the available test machine. This is environment-dependent, not a production performance SLA.
- Local metadata SQLite size approximately **22 MB**, with all event counts preserved and timeline explicitly sampled.
- Security tests: denial without acknowledgement, symlink input rejection, unexpected data-classification rejection, rollback on malformed JSONL and count mismatch, tenant isolation, owner-guarded routes and idempotent imports.
- Quality claims: NO automatic promotion, NO hidden benchmark extraction, NO verified customer outcomes, NO claim of raw-data replay.

**Still pending:** benchmark ground truth, independently verified agent versions, a production-approved encrypted live database, large-scale load testing, a separate client environment, cross-browser accessibility verification and retention workflows. Do not close enterprise-security or production issues based on this result.
