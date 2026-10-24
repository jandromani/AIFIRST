# Independent Arena · QA and known limits

- Scope: `src/independent-arena.mjs`, `bin/arena-demo.mjs`, private HTTP read-only integration, GUI and public-preview boundary.
- Test suite: `npm run test:arena` checks paired verdicts, synthetic no-promotion invariant, hard-safety veto, regression, missing-cost gate, cross-tenant isolation, signed-verdict tampering, judge key pinning, duplicate/contaminated fixtures, chain corruption and HTTP endpoint access.
- End-to-end fixture: 12 **synthetic** cases; titular correct 8/12, aspirante correct 12/12; candidate 4 paired wins, 0 losses, 0 safety violations; outcome `RECOMMEND_INDEPENDENT_HUMAN_REVIEW`, production promotion `false`.
- Browser: check no overflow and no JavaScript errors at desktop 1440 px and mobile 390/320 px; local tokens not persisted.
- Pending: independent external identity, real agent inferencing, stochastic repeated evaluations, genuine hidden benchmark isolation, execution containment, third-party signing, canary and rollback with live traffic, complete repository CI and multi-browser accessibility audit.
