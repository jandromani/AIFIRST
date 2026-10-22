# External connection acceptance matrix (2026-10-22)

**No provider keys or third-party accounts are connected by this release.** These nine capabilities are mapped in `src/integration-readiness.mjs` and exposed to admins/auditors under `/v1/integrations/readiness`.

| Capability | Code today | Missing external proof | Role | Gate |
|---|---|---|---|---|
| OpenRouter Free | Synthetic metadata adapter, quota and mock E2E | Own key, successful live inference, 429 handling, DPO/vendor agreement | AI & DPO | G3/G4 |
| Identity | OIDC JWT verify, tenant and role binding | Enterprise Entra/IdP, MFA, revocation, sign-off | Corporate IAM | G1/G3 |
| KMS and database | AES-GCM artifacts, encrypted SQLite snapshot | Live DB encryption, protected KMS/HSM, rotation, external restore | SRE/Sec | G3 |
| AV/DLP & sandbox | Optional ClamAV, simple PII detection, metadata-only worker | Trusted scanners, Office/PDF handling, no-egress sandbox, pentest | Security/DPO | G3 |
| Executive outputs | 11 contract IDs and draft PDF/PPTX/CSV/ZIP | Source-checked content, distribution ACL, editorial approval and signed acceptance | Product & sponsor | G6 |
| ERP/tax | Draft export adapter, invoice cents, idempotent reference | Jurisdictional fiscal-compliant ERP, numbering and legal review | Finance/Accountant | G0/G7 |
| Bank/prizes | Signed statement test adapter, proposed payout batches | Live regulated bank/PSP, dual approval, KYC, settlement/returns | Treasury/Legal | G7 |
| Signatures | Ed25519 local cryptographic review and OIDC identity | Contractually accepted legal signature, signer authority and time stamping | Legal/Independent juror | G1–G7 |
| Production ops | SQLite local queue and encrypted backup | HA, DNS/TLS, central audits, external backups, SLO and incident drills | Platform/SRE | G3/G7 |

**Attestation rule:** `LOCALLY_CONFIGURED` ≠ `EXTERNALLY_VERIFIED` ≠ `PRODUCTION_ACCEPTED`. The API never declares external verification and does not expose keys.

**Next practical sequence:** finalize synthetic buyer journey + working console; choose corporate IdP + KMS and protected storage; connect trusted AV/DLP, then private delivery; obtain DPO/legal/finance approvals before customer documents; only then exercise contracted live integrations. No bank action is triggered by the local app.
