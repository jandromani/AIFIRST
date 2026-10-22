# AIFIRST · AI First Discovery Engine

> **Un hackatón interno entra. Evidencias, capacidades observadas, escenarios y roadmap salen.**

**Estado:** Operating Atlas modelado de extremo a extremo, *prototipos offline parciales*, sin producción. Repositorio público con código y datos exclusivamente ficticios. Sin Vercel, previews, CDNs ni servicios desplegados.

## Arquitectura de la empresa: 20/20 módulos, 230/230 componentes
Abrir localmente [Operating Atlas interactivo](web/atlas.html), regenerado desde [catálogo de requisitos](catalog/operating-model.json). Hay **171 relaciones de diseño**, **41 contratos JSON**, **8 gates G0–G7**, **11 productos de salida** y **18 tipos de vínculo del grafo de negocio**.

La [matriz de 230 nodos](catalog/node-traceability.json) enlaza cada pieza con su dueño, contrato y aceptación; [blueprint original conservado](reference/AI_FIRST_ATLAS_SPEC.original.json). **Cobertura documental ≠ producto funcionando.**

### Dominios
- **01–05 · PREPARAR/LANZAR:** mercado y ventas, contrato, contexto empresarial, legal/personas/confianza, diseño del reto.
- **06–12 · RECIBIR/EVALUAR:** comunicaciones, inscripción/equipos, entregas, ingesta y cuarentena, trabajos, evaluación del proyecto y evidencias de capacidad.
- **13–16 · INTELIGENCIA/ENTREGAR/ACTIVAR:** grafo con fuentes, escenarios revisables, manifiesto ejecutivo, roadmap 30/60/90 y mediciones.
- **17–20 · OPERAR/GOBERNAR:** delivery/staffing, plataforma segura, costes y margen, auditoría global.

Todos los [procesos internos y externos 13–20](catalog/phase3-workflows.json) y [fichas individuales](docs/modules/) incluyen entradas, salidas, estados, gates, responsables, costes y pendientes.

## Probar offline (Node 20+)
```bash
npm test
npm run check:catalog
npm run check:synthetic
npm run check:phase2
npm run check:phase3
npm run build:atlas
```
El motor no depende de APIs ni de dependencias NPM externas. Los ejemplos están en [phase2](examples/phase2) y [phase3](examples/phase3). La última ejecución del código en V8 aislado superó 18/18 comprobaciones de lógica 13–20; **no se ha ejecutado todavía una suite completa Node bajo checkout**. [Informe QA](docs/QA_REPORT.md).

## Inputs y outputs
- [Contratos](contracts/index.json), [intake](docs/INTAKE_PLAYBOOK.md), [outputs](catalog/outputs.json), [8 gates](catalog/gates.json).
- 13: `buildOrganizationalGraph`, `graphView` con protección de datos.
- 14: `draftScenarios` (sin asignar personas automáticamente).
- 15: `prepareExecutiveBundle` (Markdown trazable, revisión G6 pendiente).
- 16: `planActivation`, `evaluatePilotOutcome` (impacto no verificado).
- 17: `checkDeliveryOperations` (bloqueo incidentes/staffing).
- 18: `authorizeTenantAccess` (deniega accesos reales por defecto), `retentionDryRun`.
- 19: `calculateUnitEconomics` (precios y costes sintéticos).
- 20: `auditOperatingAtlas` (cobertura de diseño y faltas de producción).

## Límites y salvaguardas
Evaluamos soluciones, no hay ranking de empleados. Un resultado colectivo no mide el valor profesional individual. Los datos de capacidades requieren finalidad legítima, evidencia, revisión y posibilidad de corrección. Los grupos pequeños se suprimen. **Nunca** subir datos de clientes/empleados o secretos a GitHub público.

G3–G7 no tienen firma real ni verificación externa. No ejecutar entregas externas, asignar personas, conceder permisos ni borrar información desde este prototipo. El SaaS necesitará IAM/SSO, aislamiento, seguridad, jurisprudencia aplicable, proveedores y aprobación humana.

## Roadmap e issues
[Backlog detallado](docs/EXECUTION_BACKLOG.md) · [Estado verificable](catalog/implementation-status.json) · [Issues abiertos hasta cierre real](https://github.com/jandromani/AIFIRST/issues). Los módulos 13–20 tienen issues #14–#21 y no están falsamente cerrados.


## Vertical Slice offline · Run 0.2

**Recorrido unido con datos sintéticos:** inscripción → entrega con SHA-256 → cuarentena → evaluación provisional de proyecto → grafo de propuestas → escenarios → borrador CEO → roadmap 30/60/90 → economics → assurance.

```bash
npm run simulate:engagement   # diagnóstico sin archivos
npm run export:engagement     # informe MD + roadmap CSV + trace y hashes, bajo artifacts/ (gitignored)
```

Fuente del flujo: [vertical-slice.json](catalog/vertical-slice.json) · [Guía y límites](docs/VERTICAL_SLICE.md) · [Definition of Done](docs/DEFINITION_OF_DONE.md) · [P0 Node E2E](https://github.com/jandromani/AIFIRST/issues/22).

**No interpreta las firmas sintéticas como reales ni libera G3–G7.** El borrador tampoco acredita ahorro, seguridad, privacidad ni competencias laborales. Las pruebas reales de Node, los permisos, los conectores y un piloto autorizado siguen pendientes.


## Verificación de extremo a extremo y salida para CEO

El prototipo `0.2` incorpora [un informe HTML responsive y sin dependencias externas](docs/VERTICAL_SLICE.md), así como Markdown, CSV, traza y manifiesto SHA256. Los archivos aparecen **únicamente** al solicitar la exportación, bajo `artifacts/` (ignorado por Git).

```bash
npm run simulate:engagement  # imprimir simulación; sin persistir
npm run export:engagement    # generar 5 archivos del paquete sintético
npm run verify:local         # ejecutar Node tests, gates, E2E, Atlas y guardar evidencia
```

El protocolo de QA se documenta en [VERIFY_LOCAL.md](docs/VERIFY_LOCAL.md). La ejecución completa de Node **no se ha podido efectuar en este entorno** por bloqueo de acceso a github.com desde el contenedor; el comando queda listo para el siguiente checkout con red. Ningún test concede autorización real G3–G7.

## Implementación local A–E (21 oct 2026)

Se ha añadido un **piloto local ejecutable con Node 22 + SQLite**, separado del simulador previo. Está pensado para pruebas con **datos ficticios**, no para desplegar sobre empleados reales.

```bash
npm run test:pilot
npm run pilot:init -- "Empresa sintética"
npm run pilot:serve
```

Abrir **http://127.0.0.1:4181/** en el propio equipo. La consola no usa Vercel, CDN ni servicios externos. El token inicial se imprime una sola vez al ejecutar `pilot:init`.

**A** tests reales con SQLite y API HTTP; **B** roles locales, aislamiento por tenant, uploads SHA-256 y cuarentena; **C** adaptador HTTPS configurable para gateway IA, revisión local y jurado; **D** EX01–EX11 compatibles con los nombres originales como *manifiestos*, escenarios y grafo; **E** leads, contratos, borradores de factura, registro manual de ingresos y pagos de premios pendientes. Más detalle en [fases A–E](docs/PHASES_A_E_IMPLEMENTATION.md) y [gap register](docs/GAP_REGISTER.md).

**No está terminado al 100 % para producción.** Faltan SSO/MFA, seguridad real, autorización y firmas G1/G3–G7, proveedor IA verificado, renderizadores PDF/PPTX/ZIP y cobros/pagos ejecutables con banco/ERP. **Los issues siguen abiertos.**

## OpenRouter Free + Enterprise Integration Layer (Oct 2026)

**New code:** [OpenRouter Free adapter](src/openrouter-free.mjs), [security controls](src/enterprise-security.mjs), [OIDC and financial controls](src/enterprise-ops.mjs), [PDF/PPTX/ZIP report pack](src/enterprise-reports.mjs), [private report CLI](bin/enterprise-pack.mjs), [14 Node tests](test/enterprise.test.mjs) plus the existing 7-case pilot suite.

**Default is fail closed.** OpenRouter is only enabled with `AIFIRST_SYNTHETIC_DEMO=1`, `AIFIRST_ALLOW_OPENROUTER_FREE=1` and `OPENROUTER_API_KEY`. It sends synthetic project metadata and hashes only, with a default budget of 12 free requests/day across the local app. Free service limits apply; NOT acceptable for confidential source code, employment decisions or production SLAs without provider/legal review.

```bash
npm run test:enterprise
python3 -m pip install -r requirements-reports.txt
# Set AIFIRST_MASTER_KEY_B64 in secret storage and initialize local tenant:
npm run pilot:init -- "Empresa sintética"
npm run pilot:serve
```

**Reports**: three draft PDFs, real PPTX, CSV/JSON exports across original EX01–EX11 and AES-256-GCM-wrapped ZIP encrypted as `*.zip.aif1` (requires a separate decrypt step, not password ZIP). **Money**: HTTPS ERP draft adapter, signature-validated bank statement import and payout batch suggestions; no live bank transfer, no tax-compliant invoice certification or legal signature provider connected yet.

Read the [configuration and limits](docs/ENTERPRISE_INTEGRATIONS.md) and [revised gap register](docs/GAP_REGISTER.md) before enabling connections. No Vercel deployment, no production data.
