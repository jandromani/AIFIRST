# AIFIRST · Product web + Command Center

One local server exposes three distinct experiences:

```bash
npm run pilot:init -- "Synthetic org"    # once; keep the token private
npm run pilot:serve
```

Open `http://127.0.0.1:4181/` (brand/product), `/console` (authenticated Command Center) or `/atlas` (full Operating Atlas). No Vercel, remote JS, font/CDN dependency or analytics is needed.

## Product website

A buyer-oriented narrative with the five-stage system, explicit distinctions between design and production, a synthetic scenario selector (3 examples), 11 deliverables, 8 gates, service tiers and FAQ. Links are local routes, **not** an active enterprise signup/checkout funnel. The examples are fictitious, not client results.

## Command Center

Authenticate with `init` token (kept only in current JS memory), create an edition, select an edition previously created by the same tenant, query its draft dossier, search EX01–EX11, inspect G0–G7, see financial guardrails, and review connectors with their next external step. Data arrives from actual local SQLite-backed HTTP endpoints, not a hardcoded success fixture.

Endpoints added: `GET /v1/editions` (only current tenant) and `GET /v1/integrations/readiness` (admin/auditor; nine categories, never ready just because configured). Existing routes stay intact. Host/Origin checks reject cross-port attacks; CSP has unique nonces per page load. Credentials are never stored in localStorage or sent to other hosts.

## Tests

```bash
node --test test/ui-web.test.mjs
node --test test/*.test.mjs
```

For browser smoke tests in an environment that permits local Chromium: navigate `/` and `/console`, test desktop and 390px, three scenario choices, login, create edition, reconnect to an old edition, 11 EX cards/search, integration readiness, keyboard navigation and axe. This environment prevented browser navigation (`ERR_BLOCKED_BY_ADMINISTRATOR`), so **render-level visual QA remains open**.

For complete audit see `docs/UIUX_UNICORN_AUDIT.md`. For external connectors see `docs/CONNECTION_READINESS.md`.

## Static visual smoke (no network)

`npm run test:ux:visual` launches Chromium through Python Playwright, injects the HTML with `page.set_content()`, then exercises interactive scenarios, mobile navigation, EX search, horizontal-overflow and JS-error checks at 1440×900 and 390×844. Four screenshots are written to ignored `artifacts/uiux-smoke/`.

In this environment all **4/4** static cases passed after a hero overflow fix. The browser's HTTP/file navigation remains blocked by local policy, so the full CSP and authenticated API browser journeys still require an unrestricted QA machine.
