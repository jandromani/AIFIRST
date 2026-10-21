# 12 · Evidencia de capacidades

**Responsable:** People Analytics / Comité cliente. **Estado:** diseño completo + prototipo offline parcial.

## Entradas
Aportes corroborados, EvidenceClaim independientes, finalidad autorizada y preferencias

## Salidas
CapabilityEvidence contextualizado y CapabilityAggregate con supresión

## Proceso externo / cliente / participantes
Cada participante autorizado puede revisar su observación y solicitar corrección; dirección solo ve métricas agregadas permitidas.

## Proceso interno AIFIRST
Cruzar fuente + autoría corroborada + taxonomía, registrar incertidumbre/no respuesta, excluir ámbitos sensibles, enviar a revisión humana, agregar con umbral y retención.

## Máquina de estados
`proposed → awaiting_review → approved|disputed|withdrawn → aggregated`

## Contratos
- [EvidenceClaim](../../contracts/EvidenceClaim.schema.json)
- [CapabilityEvidence](../../contracts/CapabilityEvidence.schema.json)
- [CapabilityAggregate](../../contracts/CapabilityAggregate.schema.json)

## Seguridad y punto de no retorno
Atribución solo grupal; ausencia de consentimiento/base legal; mostrar grupos <k; uso para decisión laboral automática.

## Aceptación verificable
No inferir nivel de plantilla; evidencia trazada, revisión, privacidad y métricas de cobertura.

## Cost drivers
Revisiones, taxonomía, DPO, reclamaciones, informes

## Implementado como prototipo local
- `capability.claim`
- `capability.attribution`
- `capability.uncertainty`
- `capability.aggregates`
- `capability.human_review`

## Backlog imprescindible de producción
- [ ] revisión real por persona habilitada
- [ ] taxonomía de skills validada
- [ ] derechos y borrado
- [ ] modelo población/missingness robusto
- [ ] propuesta de formación validada

**Importante:** no se ha probado con datos reales ni se han concedido permisos externos. El prototipo jamás debe presentarse como firma humana, scanner de malware, SSO o ejecución de agentes.
