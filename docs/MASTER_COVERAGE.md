# Auditoría del inventario original del Operating Atlas

## Paridad de fuente
El fichero `reference/AI_FIRST_ATLAS_SPEC.original.json` conserva la versión 0.1.0 original del blueprint. La paridad de **230 IDs en 20 dominios** ha sido comprobada antes de migrar. El catálogo `catalog/operating-model.json` mantiene IDs estables y añade a cada nodo contratos, riesgo, criterio original y criterio ampliado.

El inventario `catalog/node-traceability.json` contiene exactamente **230 entradas**, con referencias a contratos, dueño y criterio de aceptación. Nodos con información incompleta se listan en `unresolved`.

## Estados y límites
- Inventario y criterios completos **como diseño**.
- Prototipos offline: módulos 01–20 de cobertura variable (no producto terminado).
- Implementación productiva: no verificada. Necesita conectar de forma segura cada entrada, repositorio de evidencias, revisión humana, seguridad, auditoría y finalización de gates.
- Ningún nodo se considera funcional por tener ficha o conexión en el grafo.

## Semántica
`catalog/ontology.json` preserva los 18 tipos de relación de negocio del blueprint. Las 171 relaciones del grafo del Operating Atlas son dependencias de **diseño**; no pruebas de hechos empresariales ni de capacidades personales reales. El motor `buildOrganizationalGraph` solo admite relaciones observadas si existe evidencia explícita.
