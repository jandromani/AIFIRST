# AIFIRST · Product & UX due diligence

**Audit date:** 2026-10-22. **Assets:** `web/pilot.html` original, `web/atlas.template.html` and canonical model (20 domains, 230 components, 171 relationships, 11 deliverables), local Node API, new `web/index.html` and Command Center.

> **Decision:** a venture-grade company cannot ask users to understand a JSON debugger before it explains the product. Build two experiences: (1) a clear buyer journey, and (2) a trusted operating workspace. Keep every status grounded in a real record or identify it as design/simulation. **No fabricated customer proof, ROI, testimonials, security certification or growth traction.**

## Critical observations in the previous UI

| Priority | Observed problem in original UI | Consequence | Work delivered | Exit criterion |
|---|---|---|---|---|
| P0 | Home page was just a local token + create-edition console | CEO cannot identify buyer, value, differentiation or CTA in 30 s | New marketing home with clear problem/solution, five-stage lifecycle, roles, controlled examples, offerings and honest FAQ | Five real buyers understand problem and next action without instruction |
| P0 | 230 components and 11 outputs shown as counts with no journey | Counts appear as marketing claims, not operational capability | Consistent 'design' labels, editorial framing, product pages distinct from workspace | Reviewers can distinguish architecture from capabilities in production |
| P0 | Raw JSON dominates outcome UX | Nontechnical sponsor cannot act; errors are hidden | 7-view Command Center, direct actions, state messages, detailed diagnostics isolated | Sponsor completes new edition → dossier in less than 2 min |
| P0 | Live provider configuration indistinguishable from verified readiness | Dangerous false trust in financial/security controls | 9-entry readiness registry, owner, next action and verified=false by default | Zero UI claims about active signing/bank/pentests without evidence |
| P0 | No returning-user workflow | After reload, edition ID had to be pasted/recreated | Tenant-scoped edition listing and selection (no token persistence) | Authorized user can reopen prior edition |
| P1 | Domain-specific workflows hidden behind a single technical page | Navigation and information scent weak | Overview, Editions, Evidence, Governance, Finance, Connections, Diagnostics | Each key role reaches relevant state in <= 3 actions |
| P1 | Mono-purpose forms not consistent with product's breadth | Looks like an internal proof of concept | Design system: confident typography, deep green, lime, subtle surfaces, responsive grids, consistent cards and affordances | Visual review desktop/tablet/mobile before release |
| P1 | No visual explanation of evidence-to-decision | Competitive moat is invisible | Diagram with challenge → evidence → review → activation, 3 interactive SYNTHETIC stories | No client impact implied; interaction predictable |
| P1 | Nav/token/error patterns not fully accessible | Low keyboard and mobile confidence | Skip link, focus-visible, 44 px targets, semantic landmarks, details FAQ, aria-current, aria-live, reduced motion | Independent WCAG 2.2 AA audit, screen reader review |
| P1 | Atlas used a separate coral/light visual language | Brand fragmentation across routes | Branded Atlas header and return path; preserve light graph for legibility | Full tour feels like a single design system |
| P2 | No actual acquisition workflow | Cannot convert traffic into qualified pipeline | Landing supports product education only; secure intake/CRM planned | Real contact channel, consent, analytics governance, CRM records |
| P2 | Static demo with invented customer achievements would be tempting | Legal and reputational risk | Explicit fictional examples, no bogus logos, zero production-verification badges | Marketing/compliance approval |

## Heuristic score (not measured conversion or accessibility certification)

| Dimension | Prior technical UI /10 | Target after redesign /10 | Evidence required |
|---|---:|---:|---|
| Immediate executive clarity | 2 | 8 | 5 moderated 30-second tests |
| Differentiation & narrative | 3 | 8 | Prospective buyer review |
| Visual consistency | 4 | 8 | Multi-device visual QA |
| Task navigation | 3 | 8 | Completion timing per persona |
| Output discoverability | 3 | 8 | EX01–EX11 task tests |
| Transparency and trust | 5 | 8 | Legal, security and sponsor review |
| Accessibility | 4 | 8 | WCAG 2.2 AA assessment; automated+manual |
| Mobile usability | 4 | 8 | 320/390/768px keyboard/touch QA |
| Evidence and customer proof | 1 | 3 | Real, consented pilots and signed case studies |
| Conversion and onboarding | 2 | 6 | Qualified CTA, forms, CRM, opt-in tracking |

**Target scores are product objectives, not verified achieved ratings.** No Lighthouse numbers, conversion rates or user study outcomes are claimed.

## Information architecture

### 1. Product landing (`/`)
Brand → value proposition → operating method → controls and outputs → interactive synthetic scenarios → engagement tiers → objections/FAQ → architecture/console. A visitor should know *what AIFIRST does, for whom, what it produces, and what is not yet certified*.

### 2. Command Center (`/console`)
Overview → Editions (create/restore) → Evidence (11 original deliverables) → Governance (G0–G7 pending by default) → Finance (never label manual bank ref as paid) → Connections (readiness per integration) → Diagnostics. Credentials only in JavaScript memory, not cookies, localStorage or query strings.

### 3. Operating Atlas (`/atlas`)
Full navigable business model. **The graph represents design**, not live instances or customer data. Visual alignment with the new identity; the original 230-node dataset and node detail interactions are preserved.

## Design system

- Background: `#0a1112`; panel: `#15201e`; stroke: `#30423a`; primary ink: `#edf5ef`; supporting text: `#a5b6ad`; accent: `#d8fa80`.
- Headline system: editorial 50–100px hero, tight tracking, plain-language promises; UI headline 34–56px; body 13–17px depending on density.
- Interaction: large pill CTA, 44px+ form actions, clear focus-visible, readable pending/blocked messages.
- Governance: success green **only when there is verifiable success**. Coral/amber for risk; product growth UI never hides regulatory limitations.
- No external fonts, analytics, JavaScript dependencies or images are required for local operation.

## Verification performed and limits

**Executed in this iteration:** Node 22 tests against SQLite and loopback HTTP including tenant isolation, strict Host/Origin, nonce CSP, marketing routes, readiness and test copy; tested responsive CSS rules and static JS syntax. **Browser visual testing in the current container was blocked by Chromium policy (`ERR_BLOCKED_BY_ADMINISTRATOR`) for HTTP and file:// routes**, so do not claim screen-reader/browser-device testing or a Lighthouse score. Add these to release QA gate.

### Explicit release QA (open)
1. Chrome/Firefox/Safari screenshots at 320, 390, 768, 1024, 1440; horizontal overflow, fonts, scenario picker, links, sticky nav and keyboard order.
2. Axe-core + manual WCAG 2.2 AA (focus not obscured, target size, accessible authentication, non-text contrast, name-role-value).
3. User tests: 5 CEO/CIO buyers, 3 sponsors, 2 jurors, 2 admins; first 30 seconds, create edition, review EX, understand gating, distinguish paid/unverified.
4. Instrument acquisition only after consent and CRM integration; no dark patterns or automatic lead capture.
5. Production hosting decisions: custom domain, DNS, TLS, CSP, static edge delivery, CI/CD and operational ownership; **no Vercel deployed by this work**.
6. Signed customer evidence and original case studies; no invented logos, 0% claims or testimonies.

## Remaining strategic product gaps

- Public web currently remains a local development experience. No certified login, public production domain, support, CRM, billing UI or lead pipeline.
- Real task-driven product UX still needs guided onboarding, client roles, graph drilldowns from real evidence, jury workspace, submissions, upload progress, cost explorer, signed review screens, secure EX delivery and acceptance dashboard.
- Operational controls remain configured locally rather than verified externally. In particular OpenRouter Free is demo-only for synthetic metadata; true IdP/KMS/DLP/ERP/bank/signature connections require authorized credentials and third-party evidence.

**Source of accessibility standard:** https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/.
