# AIFIRST · Public website, private product

**Release status (22 October 2026): public GitHub repository; no AIFIRST Vercel project or deployment found in the connected Vercel account.** This document prepares a deployment. It does not authorize one.

## The product is not just static HTML

The website is a static marketing frontend. The backend is Node.js + SQLite local to the operator, plus optional Keycloak, PostgreSQL, S3-compatible storage, OpenBao, ClamAV and provider integrations. Agent Evolution OS is a persistent, governed agent runtime. **The website and the backend have different deployment readiness.**

| Surface | Public snapshot? | Private behavior |
|---|---|---|
| Discovery landing | YES | Product storytelling and interactive synthetic scenarios |
| Evolution OS | YES, **read-only** | Actual swarm requires bearer-authenticated Node API |
| Operating Atlas | YES | Static 230-component design model, not production claim |
| Command Center | NO | Tenant-scoped editions, evidence, governance and exports |
| Integration Lab | NO | Authenticated external-system verification records |

`npm run preview:build` writes `dist-preview/`, with relative links that work offline and disabled backend actions. It replaces the private console and lab with explanatory pages and writes `PREVIEW_STATUS.json` with `backend_included:false` and `production_ready:false`. Builds from full Git checkout include `web/atlas.html`; partial checkouts receive an explicit Atlas placeholder rather than fabricated data.

The static bundle has **no API, no user data, no credentials, no payments and no authentication**. It may be hosted separately, but it is not a usable multi-tenant SaaS. Never make the localhost HTTP server internet-accessible as a workaround; its loopback, origin and host restrictions are deliberate security boundaries.

## Build and QA without Docker

```bash
node --version          # Node 22.16+
npm run test:public
npm run preview:build
# Open dist-preview/index.html locally.
```

To test in a browser, use a local static HTTP server or review its generated files; `file://` navigation may be blocked by security policy. Chrome/Chromium visual regression remains supplementary to Node tests; manual WCAG assessment and prospective buyer testing are still open.

## Vercel: future opt-in **only**

The committed `vercel.json` defines only the **static output**. Its presence does **not** create a project, trigger a deployment, link GitHub or configure a domain. No Preview or Production deployment is requested here. If publication is later authorized, inspect the selected team/project/production environment first, and ensure the static build cannot access private API endpoints, secrets or runtime storage.

**Release gates before public posting:** signed marketing copy approval, manual navigation/mobile QA, no client-identifying references, working contact/lead privacy policy, accessibility check, explicit production target and budget authorization. The marketing release is independent from the much stricter enterprise SaaS acceptance gate.

## Truth ledger

- GitHub repository: `https://github.com/jandromani/AIFIRST`, public, default branch `master`.
- Connected Vercel search: no project matching the repository or AIFIRST name as of 2026-10-22. **That does not prove the project cannot be hosted elsewhere.**
- Public customer ROI: none claimed; all project interactions are synthetic/local.
- Generated HTML can be previewed offline; the private HTTP API runs only at loopback.
- Docker E2E with all five local services: still unverified in the build environment.
