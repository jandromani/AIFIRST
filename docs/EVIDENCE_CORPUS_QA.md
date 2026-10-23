# Corpus QA — 23 October 2026

- Inputs from provided evidence package. 22 of 23 manifest entries are present and match their published SHA-256; the absent artifact is `03_TRACE_EVENTS.jsonl` (277,117 events declared but not verified here).
- JSON imports: 2,909 runs, 255 catalog rows (254 unique IDs), 7,592 evaluation records, 105 source records, 0 external calls. Source content, roles and evidence text are not copied into SQLite.
- Reconciliation anomalies: 58 evaluation records with unresolved/missing run reference, 162 repeated evaluation IDs, 1 repeated agent ID.
- Privacy boundary: local tenant-specific HMAC pseudonyms, default `arena`, explicit study release before initial import only, no candidate or unauthenticated access, no browser/web deployment of private content.
- Evaluation independence, real replay, LLM comparisons, historical rollback and production claims remain **UNVERIFIED**.
- Tests and source-level QA must be rerun after final GitHub commit; these are not deployment acceptance criteria.
