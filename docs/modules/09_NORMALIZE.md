# 09 · Ingesta y normalización

**Responsable:** Data Engineering / Security. **Estado:** diseño completo + prototipo offline parcial.

## Entradas
Manifiestos y archivos no confiables

## Salidas
NormalizedPackage, EvidenceClaim, incidencias, trazabilidad y dictamen G3

## Proceso externo / cliente / participantes
Cliente conoce archivos rechazados y pasos de corrección, sin revelar datos de otro cliente.

## Proceso interno AIFIRST
Validar contrato, comprobar rutas e integridad, ejecutar AV/secret/PII en infraestructura controlada, clasificar, extraer, crear fuentes con localizador y preparar G3.

## Máquina de estados
`received → quarantined → scanned → canonicalized → G3_pending → approved|rejected`

## Contratos
- [IntakeReceipt](../../contracts/IntakeReceipt.schema.json)
- [NormalizedPackage](../../contracts/NormalizedPackage.schema.json)
- [EvidenceClaim](../../contracts/EvidenceClaim.schema.json)

## Seguridad y punto de no retorno
Escaneo desconocido o fallido; secretos detectados; permisos ambiguos; referencias rotas.

## Aceptación verificable
Cero ejecución de binarios antes de G3; hash y linaje verificables; doble control humano.

## Cost drivers
Archivos, tamaños, AV, OCR/parsers, revisiones manuales

## Implementado como prototipo local
- `normalize.schema`
- `normalize.hash`
- `normalize.reject`
- `normalize.accept`

## Backlog imprescindible de producción
- [ ] AV real con prueba
- [ ] secret/PII scanners aprobados
- [ ] extracción PDF/video y quality metrics
- [ ] G3 firma externa verificada
- [ ] storage privado multi-tenant

**Importante:** no se ha probado con datos reales ni se han concedido permisos externos. El prototipo jamás debe presentarse como firma humana, scanner de malware, SSO o ejecución de agentes.
