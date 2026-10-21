# Contrato externo de salida · 11 entregables previstos

Los 11 outputs de `catalog/outputs.json` son **diseño**, no informes producidos por este MVP.

## Envelope común
Cada salida necesita `deliverable_id`, `engagement_id`, `version`, `generated_at`, `source_refs[]`, `limitations[]`, `owner_role`, `review_status`, `access_policy`, `retention_policy` y `content_digest`. No publicar una conclusión como "hecho" si no hay fuente, período y alcance.

## Audiencias y protección
CEO: resultados agregados, decisiones y riesgos. Líderes de proceso: soluciones y KPI medidos. DPO/Legal: tratamiento y auditoría. RRHH: solo cobertura de capacidades dentro de finalidad autorizada, nunca decisiones laborales automáticas. Participantes: información, condiciones de participación y revisión.

## Tipos de evidencias que sustentan afirmaciones
`MEASURED`: medición reproducible; `OBSERVED`: evidencia verificada; `SELF_REPORTED`: declaración de fuente; `ESTIMATED`: cálculo con supuestos; `HYPOTHESIS`: propuesta no validada; `UNKNOWN`: no inferir. Toda métrica debe transportar tipo, unidad, período, muestra y cobertura.

## Gates de salida futuros
G3: entrada validada en almacenamiento seguro. G4: evaluación contrastada por jurado. G5: escenarios sin impacto laboral automático y revisados por comité. G6: informes sin conclusiones huérfanas. G7: activación/retención/exportación confirmada.

## Criterio comercial
El cliente compra: diagnósticos concretos, opciones, responsables y plan. No compra un "ranking de toda la plantilla" producido automáticamente desde un concurso ni una promesa de ahorro sin medidas.
