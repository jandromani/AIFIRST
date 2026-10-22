# AIFIRST — OpenRouter Free / Seguridad / Informes / Finanzas / Gates

## Estado honesto

La plataforma conserva el piloto local **sin desplegar Vercel**. Los nuevos módulos implementan límites verificables: OIDC JWT RSA/ECDSA, cifrado AES-256-GCM por tenant+artifact, clasificación básica, adaptador OpenRouter Free restringido a **metadata sintética**, renderizadores PDF/PPTX y ZIP envuelto en AES-GCM, envíos HTTPS a ERP, ingestión de extractos firmados y gates con Ed25519 + OIDC. **Ningún proveedor externo se activa sin configurar claves/trust anchors**. No están hechos el pentest, la aprobación legal del tratamiento, el DPA del cliente, el certificado cualificado de firma, ni la integración bancaria PSD2.

## OpenRouter Free

- Abrir https://openrouter.ai/settings/keys y generar una clave de API de la cuenta propia. No introducirla en navegador ni en Git.
- Modelo recomendado para **demostración sintética**: `openrouter/free` (routing gratuito sujeto a disponibilidad, no un modelo estable). Alternativamente usar un ID del catálogo con sufijo `:free`.
- Documentación oficial de precios: Free dispone de **50 llamadas/día** y no ofrece routing regional exclusivo, SSO/SAML ni SLA. El adapter impone **12 llamadas/día por cuenta**, registradas de forma persistente cuando se le pasa SQLite.
- Solo se transmiten título sintético, nombres y SHA-256 de artefactos y la rúbrica, sin bytes ni PII. Hay rechazo por patrones sensibles y por llamada no sintética. Es una barrera adicional, **no una certificación DLP**.
- No se envían fuentes originales, perfiles de trabajadores, correos, tokens ni archivos. El output se conserva como `PENDING_HUMAN_REVIEW`, nunca aprobado como ranking laboral.

```
export AIFIRST_SYNTHETIC_DEMO=1
export AIFIRST_ALLOW_OPENROUTER_FREE=1
export OPENROUTER_API_KEY='introducir_en_el_sistema_de_secretos'
export AIFIRST_FREE_MODEL=openrouter/free
export AIFIRST_FREE_DAILY_LIMIT=12
node bin/api.mjs serve
```

No hay petición de inferencia a OpenRouter hasta que se invoque explícitamente el endpoint de agente con un submission de prueba, escáner y revisión local G3. Las cuotas upstream también pueden rechazar una llamada.

## Seguridad

1. Generar `AIFIRST_MASTER_KEY_B64` con 32 bytes aleatorios **fuera del repositorio**. El servidor no acepta uploads HTTP sin clave; cifra el contenido después del escaneo local. Cada artefacto usa AES-256-GCM, salt por tenant, info por ID y nonce aleatorio. La SQLite local **no** está cifrada: contiene metadatos, títulos y auditoría. Cifrado completo de DB, backups, rotación KMS/HSM y gestión secretos siguen pendientes.
2. `AIFIRST_ENABLE_CLAMAV=1` requiere ClamAV instalado y firmas actualizadas. Además se aplica detección heurística de email/IBAN/DNI/secretos; las coincidencias se rechazan. **No es un DLP certificado ni un parser seguro para PDF/Office**, y un `CLEAN` de ClamAV no libera G3 externo.
3. Configurar issuer/audience/JWKS público **de fuente confiable**: `AIFIRST_OIDC_ISSUER`, `AIFIRST_OIDC_AUDIENCE`, `AIFIRST_OIDC_JWKS_FILE`. La importación de claves remotas desde cabeceras JWT está prohibida. Un admin vincula explícitamente `issuer+sub` a usuario, tenant y rol locales. Un JWT legítimo sin binding no accede.
4. `AIFIRST_REQUIRE_OIDC=1` deshabilita token local en endpoints API salvo bootstrap fuera de API. Para autenticación de producción faltan sesiones, revocación y MFA del proveedor real.
5. Firmas: el revisor OIDC registra su Ed25519 pública y firma un payload con tenant/edition/gate/evidence SHA. El resultado es **firma criptográfica válida, NO firma electrónica cualificada** ni aceptación contractual; deja el gate pendiente del requisito legal externo.
6. El motor no ejecuta código de submissions; faltan sandbox verificable, política de red, AV firmado externo, auditoría independiente, backup/restore, KMS y pentest. Se evita ejecutar código no confiable mientras tanto.

## Informes EX01–EX11

Dependencias de representación: `python -m pip install -r requirements-reports.txt` (en venv local). El renderer genera **archivos PDF reales** (EX01/EX06/EX08), un **PPTX real** (EX02), CSV/JSON EX03–EX10 y el resultado de auditoría EX11. EX09 siempre devuelve `WITHHELD`: no publica datos individuales en informes CEO.

`src/enterprise-reports.mjs` agrupa los 11 ficheros en un ZIP con hashes y lo protege con AES-256-GCM. El archivo resultante **no es ZIP con contraseña compatible directamente con WinZip/7-Zip**: es un envelope `AIF1` que se debe descifrar con la función `decryptDraftArchive` o el CLI seguro antes de extraer. El paquete permanece `release_allowed=false` y no contiene firmas de aprobación.

## Finanzas

- ERP: `AIFIRST_ERP_ENDPOINT` HTTPS y `AIFIRST_ERP_API_KEY` del ERP real (ej. integración fiscal del cliente/gestoría) — envío solo de **factura borrador**, con idempotency key. La respuesta externa `accepted/pending` no certifica validez fiscal.
- Banco: `AIFIRST_BANK_STATEMENT_VERIFY_KEY_PEM` de un canal formal verificado. Un extracto firmado Ed25519 con referencia/importe/moneda coincidente se registra como `BANK_STATEMENT_IMPORTED`. **No ejecuta transferencia ni confirma una operación con una API bancaria en vivo.**
- Premios/proveedores: `payoutBatch()` prepara solicitudes sin identidad bancaria ni ejecución. Necesita proveedor de pagos, autorizaciones de tesorería, verificación antifraude y asesoría fiscal.
- Faltan facturación electrónica adaptada a país/cliente, números y series legales, abonos, IVA y comunicación AEAT/gestoría si aplica, conciliación viva/PSD2, pagos bancarios/SEPA firmados y devoluciones.

## Gates + API

`GET /v1/integrations/status` (admin/auditor) presenta qué conectores se han configurado. Nunca muestra claves. Nuevos endpoints:

- `POST /v1/oidc-bindings` (admin) — vínculo entre subject OIDC y tenant/rol/principal; NO asigna automáticamente usuarios externos.
- `POST /v1/signing-key` (OIDC verificado) — clave Ed25519 pública.
- `POST /v1/editions/:id/approvals` — firma de payload G1–G7 con hash de evidencia; respuesta legal pendiente.
- `GET /v1/editions/:id/approvals` — muestra firmas bajo permisos.
- `POST /v1/editions/:id/report-pack` — solo synthetic mode, genera paquete en memoria, devuelve base64 cifrado+manifest; no es entrega oficial.
- `POST /v1/invoices/:id/erp-export` — si hay ERP configurado.
- `POST /v1/invoices/:id/bank-statement` — si hay clave de firma bancaria.
- `GET /v1/editions/:id/payout-batch` — solicitud de desembolsos pendientes.

## Qué impide afirmar 100 % listo para clientes

No tenemos identidades corporativas conectadas, claves bancarias verificadas, certificado de firma cualificada, backend cloud multi-tenant endurecido, external DLP/AV homologado, sandbox, no-repudio legal, KMS, auditoría y backups verificables, ni pruebas con datos reales autorizados. **El código hace controles reales, pero la operación enterprise sigue bloqueada hasta que se conecten y validen esos proveedores.**

## CLI seguro para entregar un paquete de pruebas

Primero crear la empresa y su edición mediante `node bin/api.mjs init "Empresa sintética"` + `serve`, y guardar el token en el almacén de secretos local. Cuando existan datos de ejemplo:

```
export AIFIRST_SYNTHETIC_DEMO=1
export AIFIRST_MASTER_KEY_B64='<clave base64 de 32 bytes>'
export AIFIRST_ADMIN_TOKEN='<token local de admin>'
node bin/enterprise-pack.mjs export ed_<uuid>
# Se guarda en .aifirst-local/exports/<tenant>/<edition>.zip.aif1
# Para inspección explícita offline:
node bin/enterprise-pack.mjs decrypt ed_<uuid>
```

La exportación predeterminada nunca escribe las versiones PDF/PPTX descifradas en disco; la opción `decrypt` requiere acceso admin y crea un ZIP temporal **sin cifrar en almacenamiento local**, por lo que se debe retirar una vez revisado. No usar con PII real.

## Security iteration 2026-10-22

See [CONNECTION_READINESS.md](CONNECTION_READINESS.md). Tested offline encrypted SQLite snapshots with isolated recovery; explicit loopback Host/Origin checks and CSP nonce; durable synthetic-only queue and OpenRouter e2e adapter fix; invoice manual references labelled unverified. **Live tenant DB encryption, external KMS, banking and legally binding gates remain unverified.**
