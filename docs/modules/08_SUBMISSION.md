# 08 · Entregas y evidencias

**Responsable:** Challenge Ops / Participantes. **Estado:** diseño completo + prototipo offline parcial.

## Entradas
Reto y rúbrica fija, participante/equipo válido, materiales, licencias y pruebas

## Salidas
SubmissionManifest y snapshot contenido con huellas verificables

## Proceso externo / cliente / participantes
El equipo rellena formulario/manifiesto, entrega README y artefactos en carpeta privada, recibe comprobante y puede corregir dentro de plazo.

## Proceso interno AIFIRST
Comprobar equipo/fecha, fijar snapshot, verificar rutas/hashes, licencia y contribuciones declaradas, emitir recibo con estado.

## Máquina de estados
`draft → uploaded → frozen → received → quarantined|rejected|accepted`

## Contratos
- [SubmissionManifest](../../contracts/SubmissionManifest.schema.json)
- [IntakeReceipt](../../contracts/IntakeReceipt.schema.json)

## Seguridad y punto de no retorno
Ruta insegura, symlink, digest incorrecto, falta README o licencia incoherente.

## Aceptación verificable
Toda entrega tiene ID, fecha, manifiesto, hash, archivos y motivos de rechazo.

## Cost drivers
Volumen bytes, número archivos, proveedores almacenamiento, soporte

## Implementado como prototipo local
- `submission.readme`
- `submission.freeze`

## Backlog imprescindible de producción
- [ ] Adaptadores Drive/SharePoint/S3
- [ ] recibo persistente y reloj fiable
- [ ] control de versiones/deduplicación privada
- [ ] licencias y propiedad intelectual revisadas

**Importante:** no se ha probado con datos reales ni se han concedido permisos externos. El prototipo jamás debe presentarse como firma humana, scanner de malware, SSO o ejecución de agentes.
