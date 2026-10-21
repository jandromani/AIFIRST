# 20 · Calidad y control total

**Propietario:** Risk / QA / Dirección · **Fase:** 08 · OPERAR · **Estado:** contrato y referencia offline; producción pendiente.

## Propósito
Aseguramiento del catálogo y del servicio end-to-end, con evidencias e incertidumbres.

## Entrada y salida
- **Entrada:** Controles y salidas de todos los dominios
- **Salida:** AuditBundle y decisiones de calidad
- **Aceptación:** Entrada tipada, salida versionada, evidencia y aprobación según riesgo
- **Contratos:** RiskRecord, EventEnvelope, DeliverableManifest

## Proceso externo
El sponsor recibe evidencias de controles, riesgos no resueltos, versiones y pruebas; el auditor puede rastrear cada resultado hasta su fuente.

## Proceso interno
Auditar catálogo, contratos, gates 0–7, seguridad, modelo IA, equidad, linaje, cambios, costes, retención, export y acciones correctoras.

## Máquina de estados
`design → tested → validated → production_verified`

## Condiciones de bloqueo
Gate sin responsable, salida sin evidencia, vulnerabilidad crítica, borrado no probado o falsa cobertura.

## Drivers del precio
QA, pruebas, auditorías independientes, legal, control versiones, cambios.

## Referencia funcional
`auditOperatingAtlas`. No es servicio en producción; esta referencia no firma gates ni otorga acceso real.

## Pendiente para operar con clientes
Pruebas extremo a extremo, tenant tests, seguridad avanzada, evals agentes, aceptación formal y trazabilidad de datos reales.

## Nodos y criterios de aceptación (fuente: Operating Atlas original)

| Identificador | Componente | Entrada | Salida | Criterio de aceptación |
|---|---|---|---|---|
| `assurance.inventory` | Inventario componentes | Grafo completo | Registro cobertura | Todo nodo dueño + contrato |
| `assurance.contracts` | Contract testing | JSON schemas | Resultados de validación | Backward compatibility |
| `assurance.quality_gates` | Gates G0–G7 | Transiciones operativas | Actas / bloqueos | No omisión silenciosa |
| `assurance.security_testing` | Testing de seguridad | Permisos y sandbox | Informe hallazgos | Cerrar críticos antes de ejecución |
| `assurance.llm_evals` | Evals de agentes | Golden set y red team | Métricas fiabilidad | Regresiones por versión |
| `assurance.fairness_audit` | Equidad y accesibilidad | Rúbricas y muestras | Revisión humana | Señalar límites estadísticos |
| `assurance.lineage_audit` | Trazabilidad fuente-output | Claims y documentos | Rutas de evidencia | Toda afirmación decisiva citable |
| `assurance.change_control` | Gestión versiones | Prompts,modelos,contratos | Control de cambio | Re-evaluar impactos |
| `assurance.finance_audit` | Auditoría costes | Facturas/mediciones | Margen comprobado | Presupuestos vs reales |
| `assurance.retention_audit` | Auditoría borrado | Logs de eliminación | Prueba de cumplimiento | Cierre por tenant |
| `assurance.exit_audit` | Cierre de cliente | Entregables y revocación | Certificado cierre | Datos y permisos retirados |
| `assurance.lessons` | Mejora continua | KPIs y feedback | Backlog de producto | Criterios priorización |
