# 11 · Evaluación de soluciones

**Responsable:** Quality Lead / Jurado externo. **Estado:** diseño completo + prototipo offline parcial.

## Entradas
Rubric congelada, SubmissionManifest, claims verificados, resultados pruebas y revisiones

## Salidas
EvaluationResult, JuryReview, discrepancias y G4

## Proceso externo / cliente / participantes
Participantes conocen criterio, ven evidencia aplicable a su proyecto y disponen de canal de impugnación.

## Proceso interno AIFIRST
Relacionar criterio con fuentes, calcular nota provisional de SOLUCIÓN, bloquear si faltan claims, analizar desacuerdo, solicitar evaluación externa, resolver objeciones y firmar G4.

## Máquina de estados
`not_scored → draft → evidence_required|jury_pending → appeal_pending → signed|rejected`

## Contratos
- [Rubric](../../contracts/Rubric.schema.json)
- [EvidenceClaim](../../contracts/EvidenceClaim.schema.json)
- [EvaluationResult](../../contracts/EvaluationResult.schema.json)
- [JuryReview](../../contracts/JuryReview.schema.json)

## Seguridad y punto de no retorno
Criterio sin fuente; jurado recusado; rubric drift; fallo seguridad; firma no comprobada.

## Aceptación verificable
Ninguna nota huérfana; comparar solo retos/rúbricas/niveles compatibles con G4 real.

## Cost drivers
Jueces, doble lectura, pruebas, seguridad, recursos reclamaciones

## Implementado como prototipo local
- `evaluate.tech_quality`
- `evaluate.jury_review`
- `evaluate.solution_rank`
- `evaluate.signoff`

## Backlog imprescindible de producción
- [ ] identidad/jurado independiente verificados
- [ ] resolución de discrepancias y recursos
- [ ] criterios evaluados por motor real
- [ ] G4 firma auténtica y publicación auditable

**Importante:** no se ha probado con datos reales ni se han concedido permisos externos. El prototipo jamás debe presentarse como firma humana, scanner de malware, SSO o ejecución de agentes.
