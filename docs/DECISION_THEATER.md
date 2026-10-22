# AIFIRST Decision Theater · public interactive experiments

**Release status:** static, synthetic, client-side simulation. **Not** enterprise production proof, a deployed SaaS, a cryptographic signature, a legally accepted approval or a hidden benchmark.

## Three actual experiences

1. **Discovery → decision**: 10 fictional solutions with value, evidence, risk and estimated pilot effort. A user selects conservative/balanced/exploratory weights, adjusts pilot budget and acceptable risk, inspects source IDs and sees which projects become eligible. Recomputed results produce a downloadable JSON receipt with parameters, selected IDs, G5-pending state and an illustrative noncryptographic checksum.
2. **Agent Arena**: compare an incumbent with Mirror v7 or Candidate v12 against six **public synthetic fixtures** in the same job. The gate rejects insufficient improvement, an unsafe outcome or an excessive per-run budget. A fictional independent reviewer can authorize a simulated 10% canary and reverse it. No untrusted code or models execute in the browser.
3. **Replace DIOS**: one frozen roster of five fictional active agents, individual votes, real veto logic in JS and an independent *mock* gate. A change requires all five YES votes plus the extra checkbox. The constitution version increments; the irreducible safety/rollback rules remain outside the ballot. These are UI votes, **not Ed25519 ballots**.

All case data and reference answers are embedded in `web/demo.html` and are available to anyone inspecting the source. They are deliberately inspectable for a transparent marketing simulation. In the private Evolution OS, different enforcement mechanisms and independent evaluations apply.

## Use locally, without Docker or accounts

```bash
node --version  # >=22.16
npm run test:theater
npm run preview:build
# Open dist-preview/index.html, or dist-preview/demo.html#arena
```

Direct local file access to `web/demo.html` works in browsers that allow opening HTML files. The three panels use hash navigation: `#discovery`, `#arena`, `#dios`. No CDN, external scripts, API keys, cookies, tracking or browser storage are used. Each downloaded JSON receipt states `simulation_only:true`, `production_release:false` and `cryptographic_attestation:false`.

For an interactive browser regression test (Python Playwright + Chromium required):

```bash
python -m pip install playwright
python -m playwright install chromium
npm run test:theater:visual
```

The browser smoke checks 1440, 390 and 320 widths, navigation, scenario controls, promotion eligibility, a safety veto, mock canary/rollback, constitutional veto and 5/5 adoption, JSON download, runtime errors and horizontal overflow. **These are developer QA checks, not an independent accessibility evaluation or proof of production security.**

## Backend boundary and public release rules

- `bin/api.mjs` serves `/demo` on loopback beside `/`, `/evolution`, `/atlas`, `/console`, and `/lab`. Its existing Host/Origin policy remains in place.
- `bin/build-public-preview.mjs` exports `demo.html` while rewriting links and installing `noindex` and `robots.txt` rules. It replaces `/console` and `/lab` with explanation pages; the private API is not copied.
- The public snapshot can be **manually authorized and deployed separately** later. Nothing in this change runs Vercel or makes the private server reachable on the Internet.
- Never send customer documents, personal or employment data to this demo. It contains fixtures only.

## Deliberately not equivalent to the full product

- Source reference IDs are fictional evidence labels, not real uploaded attachments or independently validated sources.
- The hash is FNV-1a, a demo checksum, *not* SHA-256 or a cryptographic signature.
- Benchmark fixtures are public, *not* held-out or secret and therefore cannot certify model generalization.
- Canary, reviewer approval, constitution votes, score, cost, invoices, DPA, jurisdictional gates and reports are **illustrations**; no production side effect takes place.
- The embedded scoring rules make decisions from fictional values. A real enterprise project requires validated data, role-specific access controls, human adjudication and risk review.

## Next gates

1. Real usability sessions with the three buyer personas; copywriting validated by independent readers.
2. Axe and screen-reader checks, Lighthouse on the eventually authorized public site and real mobile browser review.
3. External pilot with a privacy/security review and signed customer consent, kept entirely separate from the public theater.
4. Explicit decision whether to authorize the **static-only** Vercel deployment; not granted by building the preview.
