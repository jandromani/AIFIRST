# QA / Release Evidence — 21 octubre 2026

## Inventario
- **20 dominios, 230 nodos, 171 relaciones de diseño**; paridad exacta de 230 IDs con `reference/AI_FIRST_ATLAS_SPEC.original.json`.
- 230 entradas en `catalog/node-traceability.json` con contrato, responsable y criterio; cero nodos con esos metadatos ausentes en revisión estructural.
- **41 contratos JSON Schema**, **8 gates** definidos (G0–G7), **11 outputs** previstos, **3 SKU comerciales** como hipótesis.
- `catalog/implementation-status.json`: 20 dominios y todos `NOT_READY` para producción.

## Comprobaciones ejecutadas
- 01–05: 21/21 invariantes de código en V8 aislado con documentos sintéticos.
- 06–12: 16/16 comprobaciones en V8 con hashes conocidos y fichero simulado; además 11/11 verificaciones de integración de catálogo, esquemas y HTML en el turno anterior.
- 13–20: **18/18 comprobaciones de lógica ejecutadas** a partir de `src/phase3.mjs` y `src/core.mjs` publicados; filesystem y digest crypto simulados; riesgos negativos: cross-tenant, enlaces sin fuente, privacidad de informes, ciclos, presupuesto y acceso sin autorización.
- Escenario sintético de `PriceModel`: coste directo 12.897,50 €, propuesta 25.000 €, contribución 12.102,50 €, margen bruto aproximado 48,41 %, precio mínimo de margen objetivo 40 % de 21.495,83 €.
- G5/G6/G7 permanecen `PENDING` por diseño. La simulación NO emite decisiones laborales ni certifica beneficios.

## Pruebas repetibles, todavía no ejecutadas como Node real
```bash
npm test
npm run check:catalog
npm run check:synthetic
npm run check:phase2
npm run check:phase3
npm run build:atlas
```

**Importante:** no ha sido posible clonar el repositorio en el contenedor por restricción de resolución de red. Las comprobaciones V8 NO equivalen a ejecutar Node 20+ con I/O real, tests de navegador, seguridad AV/PII/secretos, IAM, e-signature, API o proveedores. El estado de producción sigue **NO VERIFICADO** y no hay ningún deploy.

## Gates de aceptación pendientes
- G0–G2: flujo de revisión humana y contrato real.
- G3: antivirus, validación segura y firma autentificada.
- G4: jurado externo, conflictos, reclamaciones y dictamen firmado.
- G5: decisión de comité sobre escenarios; sin reasignación laboral automática.
- G6: informe revisado, firmas y acceso protegido.
- G7: handoff, KPI medidos, exportación, borrado y aceptación del cliente.

## Próximo gate de calidad
Ejecutar las suites Node en checkout, registrar consola, corregir cualquier error, probar Atlas offline en navegador y verificar confidencialidad con asesoría legal/DPO antes de una empresa real. Issues #1, #2 y #7–#21.

## Comprobación final de publicación del Atlas (01–20)

- 11/11 controles de integridad finales aprobados sobre la revisión publicada: catálogo 20 dominios/230 componentes, 230 referencias, ocho gates, 41 esquemas, ocho workflows 13–20, JavaScript sintácticamente válido, ausencia de scripts remotos y suites presentes.
- Detectada y **corregida** una discrepancia temporal del HTML: después de enriquecer los 230 nodos con metadatos de fuente, `web/atlas.html` fue regenerado y volvió a ser **idéntico** al resultado derivado de `web/atlas.template.html` + `catalog/operating-model.json`.
- Árbol GitHub confirmado: **140 archivos**, ocho fichas 13–20, cuatro suites de tests (`contracts`, `atlas`, `phase2`, `phase3`), 41 esquemas individuales. Sin `.github/workflows`, `.vercel/` ni `vercel.json`.
- Issues nuevos #14–#21 **abiertos** para implantación real de los módulos 13–20. Issue #6 actualizado como tracker global.

**Límite de verificación vigente:** las comprobaciones publicadas son análisis estructural y V8 con mocks; no hay constancia de `npm test` real, browser E2E ni pilotaje empresarial autorizado.

## Incremento de vertical slice 0.2

- Se publicaron `src/engagement.mjs`, `src/export.mjs`, `bin/engagement.mjs` y los contratos de recorrido.
- Prueba aislada de motor: caso sintético de 10 eventos, 3 nodos propuestos, 2 enlaces, puntuación 3,65/5 provisional, ocho gates no verificados.
- Exportador comprobado en V8 de solo memoria: **7/7** invariantes de contenido, privacidad básica de las fixtures, CSV, rutas y rechazo de aprobación ficticia.
- Control estructural del repositorio: **10/10** (fixtures, scripts, aislamiento offline, ausencia de Vercel, tests y gitignore).
- Se añadió un `Executive_Draft.html` visual autocontenido y pruebas Node escritas para escape HTML, ausencia de scripts externos y rechazo de gates aprobados; **sigue pendiente ejecutar estas pruebas en Node real**.
- Los artefactos exportados bajo `artifacts/` están excluidos de Git. No se ha realizado despliegue ni envío a destinatarios.


## Último incremento · QA de informe y recorrido integrado (0.2)

- Motor de recorrido 07→20 ejecutado en V8 aislado sobre las fixtures: 10 eventos operativos, 3 nodos y 2 relaciones de propuesta, valoración ficticia 3,65/5, todos los gates UNVERIFIED.
- Exportador Markdown/CSV/traza: **7/7** controles aislados de contenido y bloqueo superados.
- Exportador HTML visual: **9/9** controles aislados superados (sin scripts externos, contenido escapado, no entrega, hashes reproducibles y salida autónoma).
- Repositorio auditado: **10/10** controles estructurales tras la primera integración, sin Vercel ni GitHub Actions.
- Nuevas suites de Node: `test/engagement.test.mjs` (9 casos), `test/export.test.mjs` (7 casos), y `bin/verify-local.mjs` para registrar evidencia de ejecución.
- **Pendiente:** ejecutar realmente `npm run verify:local` en un checkout Node 20+. El informe `artifacts/local-verification.json` solo existirá tras esa ejecución, no se ha simulado su resultado.

Los contratos y la presentación son reutilizables, pero la edición no está autorizada para empleados reales. Las referencias a `verified` en fixtures son *sintéticas* y no sirven para liberar G3/G4 ni decisiones organizativas.

## Node 22 real · Nuevo piloto local A–E

- **7/7 tests de Node reales correctos**, usando `node --test test/runtime.test.mjs` en el workspace del desarrollo. Se ejercitaron SQLite real, roles y tenant, escritura real a disco, SHA-256, ingesta, revisión local, adapter de modelo simulado en test, 11 EX originales y el circuito financiero sin movimiento de fondos.
- **Consola renderizada en Chromium/Playwright** con 3 inputs, 4 botones y 0 excepciones JavaScript al cargar HTML; no fue una prueba de toda la interacción autenticada en navegador.
- **No ejecutada** la suite completa histórica `npm run verify:local` por falta de checkout de GitHub en el contenedor (DNS bloqueado). Los nuevos tests se ejecutaron desde fuentes idénticas a este commit.
- **No** se verificó un banco, SSO corporativo, antivirus instalado, factura fiscal, API de proveedor de modelos ni G3–G7 externos.
- Sin Vercel, GitHub Actions nuevos ni previews.

## 2026-10-22 — Node 22 enterprise security and reports

- Restored and executed the published Node 22 pilot code locally (7/7 earlier pilot tests).
- Implemented enterprise extension; **14/14 real Node tests pass** combining pilot plus OpenRouter/mock HTTP, AES-GCM tamper/tenant protection, PII/secret scanning, OIDC cryptographic JWT/JWKS verification, Ed25519 signatures and role gating, signed statement import, ERP draft adapter, and actual report rendering.
- Rendered genuine PDF files and opened EX01 with PDF renderer; verified 7-slide PPTX with python-pptx and document validity, encrypted ZIP contents digest.
- HTTP test covers connector status, encrypted upload and refusal to accept unverified gate/reports.
- `OPENROUTER_API_KEY`, company IdP and ERP/bank secrets are not available; **live external inference, SSO connection, financial transfer and signature authority are unverified**.
- This is a testable adapter layer, not a compliant production deployment. `node:sqlite` remains experimental on Node 22, and report generation requires Python dependencies.
- Previous historical full repo suites still require an actual full checkout with `npm run verify:local`; do not count the 14 enterprise tests as the entire 230-component operating Atlas.

## Iteración local de seguridad y conexiones · 2026-10-22

Se ejecutó Node v22.16.0 sobre los módulos `runtime`, `enterprise`, `hardening`, `queue`, `openrouter-wiring` y `output-contracts`. **22/22 tests PASS** en el contenedor, con ficheros y SQLite reales. Es una **suite parcial de los nuevos componentes**, no el resultado del `npm test` completo del checkout remoto.

- Backup consistente SQLite online, cifrado en repositorio local, verificación SHA-256 y restauración aislada; ninguna prueba DR fuera de la máquina.
- Rechazo de Host/Origin sospechosos y nonce CSP sin `unsafe-inline` para consola.
- Cola SQLite para demostración sintética con leases e idempotencia; no ejecutor sandbox de código externo ni proveedor OpenRouter real.
- E2E mock OpenRouter gratuito con las llamadas reales de la API modeladas y límite de cuota. Corregido rechazo incorrecto de la instrucción fija sobre empleado.
- Contratos EX01–EX11 fuente/catálogo/runtime verificados; ninguna firma G6 ni rendición fiscal asumida.
- Referencia bancaria registrada manualmente nunca marca `PAID`; estado `PAYMENT_REFERENCE_UNVERIFIED`.

**Faltan:** inferencia auténtica con API key del titular, SSO MFA real, KMS y live DB encryption, AV/DLP certificado, sandbox aislado, PDF/PPTX finales y EX09 privado, proveedor de firma y aceptación, ERP, banco real, tesorería, pentest, SLA y piloto autorizado.
