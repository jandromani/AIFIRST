# Historical Acceptance · QA snapshot · 2026-10-23

**Scope:** offline, Node 22.16, local SQLite and Chromium; no external model calls, Docker or Vercel. Ten privately supplied historical samples, not copied into repository or QA bundle.

- Original ten files: SHA-256 compared against their ten entries in the supplied provenance manifest, before local database writes.
- Historical runs represented: **20**; events **1,030**; evaluations **119**. These are observations in the 10 sample files, not the full 2,909-run corpus.
- Historical checks: **21/21** passed locally, all **10/10** cases imported, **0** promotion-authorizing cases. S04 boundary violation triggers `SECURITY_HOLD`; S11 remains `HEURISTIC_COMPARISON`.
- Regression: 10 new Node tests; selected suite including prior corpus tests runs locally. Check terminal test log for actual total.
- Visual: Chromium 1440px, 390px and 320px via synthetic API responses; no horizontal overflow or page JS exceptions; switching S04/S11 and zero promotion observed.
- Security: negative tests for tampered manifest, unapproved classification, roles, tenant isolation, idempotent retry and pure readonly HTTP wiring.
- The browser smoke does not prove authenticated HTTP E2E with the real pilot server. It uses a stubbed in-memory API response. It does not verify Firefox/Safari, WCAG 2.2 AA or public deployment.
- Neither independent evaluation of any LLM nor historical model replay has been attempted. No Docker service was started and no Vercel deployment created.

**Import and original corpus stay private.** All GitHub fixtures are generated synthetically, explicitly marked `SYNTHETIC`; the source files include no run/source identifiers from the user-supplied cases.
