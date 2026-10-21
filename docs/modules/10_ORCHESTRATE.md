# 10 · Motor de ejecución

**Responsable:** AI Platform Lead. **Estado:** diseño completo + prototipo offline parcial.

## Entradas
NormalizedPackage con G3 firmado, JobSpec, presupuesto y política

## Salidas
AgentTrace, logs auditables y resultados parciales

## Proceso externo / cliente / participantes
El cliente puede consultar progreso agregado, límites de costes e incidencias, nunca prompts sensibles sin permiso.

## Proceso interno AIFIRST
Planificar DAG, fijar idempotencia, evitar duplicados, asignar presupuesto/tenant, ejecutar pruebas en sandbox real, recoger trazas, manejar retry y veto.

## Máquina de estados
`created → queued → running → completed|failed|blocked → reviewed`

## Contratos
- [JobSpec](../../contracts/JobSpec.schema.json)
- [AgentTrace](../../contracts/AgentTrace.schema.json)
- [EventEnvelope](../../contracts/EventEnvelope.schema.json)

## Seguridad y punto de no retorno
G3 no verificado, presupuesto agotado, ejecución no aislada, modelo no aprobado.

## Aceptación verificable
Rerun reproducible, costes imputables y ejecución imposible sin autorización.

## Cost drivers
Tokens, CPU, RAM, duración, sandboxes, reintentos, observabilidad

## Implementado como prototipo local
- `orchestrate.scheduler`
- `orchestrate.budget`
- `orchestrate.retry`

## Backlog imprescindible de producción
- [ ] worker real + cola duradera
- [ ] sandbox aislado sin red
- [ ] gateway de modelos aprobado
- [ ] OTEL/ledger inmutable
- [ ] control identidad gate G3

**Importante:** no se ha probado con datos reales ni se han concedido permisos externos. El prototipo jamás debe presentarse como firma humana, scanner de malware, SSO o ejecución de agentes.
