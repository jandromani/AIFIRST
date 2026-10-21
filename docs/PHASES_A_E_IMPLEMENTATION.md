# AIFIRST · Fases A–E, piloto local — release candidate

**Estado de esta entrega:** MVP local con SQLite real, HTTP loopback, pruebas Node 22, consola HTML local, contratos de salida originales EX01–EX11 y contabilidad de operaciones. **No es un servicio enterprise terminado ni puede operar sobre datos reales de trabajadores.**

## A · Verificación reproducible

```bash
node --version  # Node 22+ (node:sqlite, experimental en 22)
node --test test/runtime-e2e.test.mjs
```

La suite de este módulo se ejecutó en el entorno de construcción: **7/7** test Node reales pasan sobre filesystem y SQLite reales; se probó también la consola HTML con Playwright/Chromium, sin errores de JavaScript al cargarla. No equivale a ejecutar toda la suite histórica del repositorio ni a una auditoría de seguridad. Para comprobar el histórico completo: `npm run verify:local` desde el checkout con sus archivos originales.

## B · Intake privado, controlado localmente

```bash
node bin/pilot-api.mjs init "Empresa ficticia"
node bin/pilot-api.mjs serve
```

Abrir `http://127.0.0.1:4181/` en el mismo ordenador. El comando `init` devuelve un token de administrador **solo una vez**; no subir a Git. El API exige bearer token SHA-256 para todas las rutas `/v1/`, mantiene un `tenant` en cada tabla, bloquea identidades ajenas, comprueba tamaño y SHA-256, y guarda bytes bajo cuarentena privada.

**AV:** por defecto no existe scanner y el archivo queda `UNVERIFIED`. `AIFIRST_ENABLE_CLAMAV=1` activa ClamAV local si está instalado; fallos, timeout o resultados inesperados mantienen la cuarentena. La aprobación que se emite es únicamente `LOCAL_REVIEW_ONLY`; **no es una firma acreditada G3**. Sin evaluación externa de secretos/PII, SSO, cifrado y revisión legal, no usar documentos de empresas reales.

## C · Agentes y evaluaciones

Configurar **explícitamente**, solo tras un proveedor aprobado:

```bash
export AIFIRST_MODEL_ENDPOINT='https://<gateway-autorizado>/v1/chat/completions'
export AIFIRST_MODEL_KEY='<secret-no-registrar-en-git>'
export AIFIRST_MODEL_JOB_COST_EUR='0.25' # tope estimado, NO gasto auditado
```

`POST /v1/submissions/{id}/agent` requiere artefactos escaneados y revisión local G3; invoca la API real por HTTPS con timeout. **Envía solo título, hashes y nombres** (no bytes). El resultado es un **borrador pendiente de revisión humana**, con coste **estimado**, no facturación del proveedor. Jurado en token separado y referencia explícita a artefacto; sin ranking de trabajadores ni G4 externo homologado. La ruta no se habilita sin credenciales.

## D · Grafo, escenarios, once entregables

`GET /v1/editions/{id}/dossier` produce un manifiesto semánticamente compatible con los **once IDs originales** EX01–EX11, con datos de soluciones y fuentes, escenarios y estado de gates; protege alias participantes en el resumen de dirección. EX06 exige **tres escenarios** para considerarse listo para revisión. Los formatos PDF, PPTX, portal privado y ZIP cifrado siguen marcados `REQUIRES_RENDERER_OR_HUMAN_REVIEW`: **no se fabrican archivos ficticios** para fingir que existen. Grafo derivado de SQLite; falta motor de grafo temporal/consulta real.

## E · Contratación y finanzas

`POST /v1/leads`, `/v1/editions/{id}/contracts`, `/v1/editions/{id}/invoices`, `/v1/invoices/{id}/reconcile`, `/v1/editions/{id}/payouts`. Se registra el ciclo B2B (borradores, referencias, importes en céntimos, autorización por rol, idempotencia de facturas y de referencias bancarias). **NO** emite factura fiscal validada, **NO** verifica transferencias contra banco, **NO** inicia pagos, reembolsos ni premios; se necesita proveedor de facturación, sistema bancario o conciliación externa y procedimiento fiscal/jurídico.

## API local rápida

- `POST /v1/members` (admin): `{ "role": "sponsor" }` devuelve token único.
- `POST /v1/editions` (admin/sponsor): `{ "title": "Prueba", "baseline": "10 min", "rubric": [{"key":"function","weight":0.6},{"key":"evidence","weight":0.4}] }`.
- `POST /v1/editions/{id}/participants` (admin/sponsor): `{ "alias": "alias_001" }`.
- `POST /v1/editions/{id}/submissions` (admin/sponsor): `{ "participant": "pt_...", "title": "Prototipo" }`.
- `PUT /v1/submissions/{id}/artifact` (binario, cabeceras `x-artifact-name` y `x-content-sha256`).
- `POST /v1/editions/{id}/gates`: `{ "gate":"G3", "evidence":"AV:..." }` (rol security, solo revisión local y con escaneo íntegro).
- `POST /v1/submissions/{id}/agent`: `{ "model":"modelo-aprobado", "max_cost_eur":2 }`.
- `POST /v1/submissions/{id}/evaluate`: `{ "score":3, "artifact_id":"art_...", "notes":"..." }` (juror).
- `GET /v1/editions/{id}/dossier` (admin/sponsor/auditor).

## Gate de publicación / dependencias que impiden afirmar 100 %

- [ ] SSO/MFA y JWT/OIDC del cliente, IAM granular y pruebas de pentesting.
- [ ] Almacenamiento cifrado y claves, backup + restore + RTO/RPO verificados.
- [ ] Seguridad real de archivos: AV, secretos, PII, parser malicioso, sandbox sin salida Internet, cuarentena inmutable.
- [ ] Presupuesto de modelos con costes observados, colas durables, evaluación y trazas por job.
- [ ] Jurado con identidad verificada, recusaciones, reclamaciones, firmas G3–G7 y autoridad delegada.
- [ ] Generación auténtica PDF/PPTX/CSV/ZIP cifrado para EX01–EX11, accesibilidad y entrega privada.
- [ ] CRM/ERP, factura fiscal, transferencia/TPV opcional, pagos premios y conciliación bancarios reales.
- [ ] Pruebas end-to-end con un cliente autorizado y evidencia de valor medido.

**Criterio de DoD:** conservar los issues #1–#26 abiertos para operación real; no marcar verificado ningún gate externo con una escritura en JSON/SQLite. Sin Vercel, previews ni pipelines que consuman free tier.
