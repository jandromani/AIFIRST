# 13 · Grafo de conocimiento

**Propietario:** Knowledge Graph Lead · **Fase:** 05 · INTELIGENCIA · **Estado:** contrato y referencia offline; producción pendiente.

## Propósito
Une soluciones, necesidades, capacidades, dependencias, evidencias y oportunidades.

## Entrada y salida
- **Entrada:** Objetos canónicos y resultados
- **Salida:** OrganizationalGraph v1
- **Aceptación:** Entrada tipada, salida versionada, evidencia y aprobación según riesgo
- **Contratos:** GraphNode, GraphEdge, EvidenceClaim

## Proceso externo
El cliente entrega contexto y evidencias autorizadas; consulta una vista del grafo limitada por rol y puede señalar errores de origen.

## Proceso interno
Normalizar nodos tipados; validar tenant, procedencia, vigencia y confidencialidad; crear solamente relaciones sustentadas; computar cobertura; registrar cambios temporales.

## Máquina de estados
`draft → validated → scoped_view → reviewed`

## Condiciones de bloqueo
Relaciones huérfanas, fuentes inexistentes, fugas entre clientes o identidades expuestas.

## Drivers del precio
Nº nodos/enlaces/claims, ingestión, consultas y revisiones.

## Referencia funcional
`buildOrganizationalGraph, graphView`. No es servicio en producción; esta referencia no firma gates ni otorga acceso real.

## Pendiente para operar con clientes
Persistencia temporal, autenticación/RBAC real, políticas por nodo, lineage real, índices de grafo.

## Nodos y criterios de aceptación (fuente: Operating Atlas original)

| Identificador | Componente | Entrada | Salida | Criterio de aceptación |
|---|---|---|---|---|
| `graph.ontology` | Ontología | Entidades y relaciones | Vocabulario formal | Versionado y restricciones |
| `graph.company` | Empresa/unidad/proceso | Contexto confirmado | Nodos organizativos | Owner y fecha de vigencia |
| `graph.problem` | Problema y objetivo | Brief y baseline | Nodos retos/objetivos | Relación explícita con negocio |
| `graph.solution` | Proyecto y solución | Submission + evaluación | Nodos prototipos | Link a snapshot exacto |
| `graph.skill` | Capacidad y prueba | CapabilityEvidence | Nodos skill con evidencia | Contexto y nivel de confianza |
| `graph.participant` | Identidad protegida | Pseudónimo/rol | Nodos restringidos | Vista pública anonimizada |
| `graph.technology` | Stack/dependencias | SBOM y diagramas | Nodos tecnológicos | Origen/versiones visibles |
| `graph.edges` | Relaciones tipadas | IDs validados | Aristas justificadas | Sin links semánticos inventados |
| `graph.provenance` | Capa de evidencia | EvidenceClaim | Procedencia de cada inferencia | Recorrido hasta fuente |
| `graph.query` | Consultas negocio | Pregunta autorizada | Subgrafos explicables | Filtros por rol |
| `graph.change` | Evolución temporal | Nuevas cohortes | Historial de cambios | No sobrescribir hechos históricos |
| `graph.coverage` | Auditoría cobertura | Inventario esperado | Lagunas verificadas | Métricas de completitud |
