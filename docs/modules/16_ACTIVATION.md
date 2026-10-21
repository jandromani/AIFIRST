# 16 · Activación y seguimiento

**Propietario:** Customer Success / Sponsor cliente · **Fase:** 07 · ACTIVAR · **Estado:** contrato y referencia offline; producción pendiente.

## Propósito
Convierte descubrimientos en iniciativas responsables, con seguimiento después del evento.

## Entrada y salida
- **Entrada:** Roadmap y aceptación
- **Salida:** Pilotos y medidas de resultados
- **Aceptación:** Entrada tipada, salida versionada, evidencia y aprobación según riesgo
- **Contratos:** RoadmapItem, PilotOutcome

## Proceso externo
Cliente aprueba responsables y presupuesto; acuerda métricas, toma decisiones en revisiones a 30/60/90 días y establece continuidad o cancelación.

## Proceso interno
Construir roadmap con dependencias acíclicas, baseline, owner y aceptación; enlazar pilotos a resultados y preparar acta G7/cierre de datos.

## Máquina de estados
`candidate → sponsored → approved → in_progress → measured → closed`

## Condiciones de bloqueo
Dependencias cíclicas, falta de sponsor/baseline, supuesto ahorro presentado como medido, borrado no confirmado.

## Drivers del precio
Acompañamiento, PMO, evaluaciones 30/60/90, formación y soporte.

## Referencia funcional
`planActivation, evaluatePilotOutcome`. No es servicio en producción; esta referencia no firma gates ni otorga acceso real.

## Pendiente para operar con clientes
PM tool integrations, medidor KPI, firmas sponsor, gate G7, cohort analytics y seguimiento real.

## Nodos y criterios de aceptación (fuente: Operating Atlas original)

| Identificador | Componente | Entrada | Salida | Criterio de aceptación |
|---|---|---|---|---|
| `activation.kickoff` | Kickoff pilotos | Portfolio aprobado | Charters por iniciativa | Sponsor y criterios de cancelación |
| `activation.resourcing` | Asignación validada | Preferencias y recursos | Equipo formalizado por cliente | Decisión humana y autorización |
| `activation.backlog` | Plan operativo | Work packages | Backlog 30/60/90 | Dependencias estimadas |
| `activation.training` | Formación por brechas | Capability Atlas | Itinerarios voluntarios | No usar ausencia evidencia como castigo |
| `activation.guardrails` | Gobierno pilotos | IT/seguridad/legal | Controles de ejecución | Gate previo a producción |
| `activation.benefits` | Medir impacto | Métricas baseline | Resultado real vs previsto | Métodos replicables |
| `activation.check30` | Revisión 30 días | Evidencias progreso | Estado y bloqueos | Decisiones registradas |
| `activation.check60` | Revisión 60 días | Pilotos y uso | Comparación prevista/real | Reasignar inversión si procede |
| `activation.check90` | Revisión 90 días | Medidas de negocio | Outcomes auditados | Cierre/aprendizajes |
| `activation.community` | Comunidad de práctica | Personas interesadas | Red de intercambio | Participación voluntaria |
| `activation.repeat` | Nueva cohorte | Aprendizajes y nuevas metas | Plan siguiente ciclo | Comparación temporal con límites |
