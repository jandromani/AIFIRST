# Cierre de especificación · Dominios 13–20

Se han migrado los **95 nodos exactos** del blueprint original y sus criterios al Atlas canónico. Esto cierra la **cobertura de diseño de los 20 dominios**, no la entrega empresarial productiva. El runtime actual es determinista y offline.

| Módulo | Nodos | Contratos de referencia | Función local | Producción |
|---|---:|---|---|---|
| 13 Grafo de conocimiento | 12 | GraphNode, GraphEdge, EvidenceClaim | buildOrganizationalGraph, graphView | No verificada |
| 14 Organización y escenarios | 11 | OrganizationScenario, RoadmapItem | draftScenarios | No verificada |
| 15 Informes y exportaciones | 13 | DeliverableManifest, RoadmapItem | prepareExecutiveBundle (Markdown + manifest) | No verificada |
| 16 Activación y seguimiento | 11 | RoadmapItem, PilotOutcome | planActivation, evaluatePilotOutcome | No verificada |
| 17 Operación de nuestra empresa | 11 | EngagementConfig, EventEnvelope | checkDeliveryOperations | No verificada |
| 18 Plataforma técnica | 13 | JobSpec, EventEnvelope, RiskRecord | authorizeTenantAccess (deny only), retentionDryRun | No verificada |
| 19 Pricing y unit economics | 12 | PricingQuote | calculateUnitEconomics | No verificada |
| 20 Calidad y control total | 12 | RiskRecord, EventEnvelope, DeliverableManifest | auditOperatingAtlas | No verificada |

## Flujo completo
```text
G4 (evaluación de soluciones validada)
→ 13 Grafo de evidencia y relaciones con fuente
→ 14 Alternativas organizativas, riesgos y comité → G5
→ 15 Informe ejecutivo / export por audiencia → G6
→ 16 Roadmap, pilotos, medición 30/60/90, entrega y cierre → G7
          ↳ 17 Delivery OPS · 18 Plataforma · 19 Economics · 20 Assurance
```

**Límites:** sin identidad real, sin firmas, sin entornos multi-tenant, sin PDF/PPTX productivos, sin motores de IA reales, sin integraciones de PM. Los comandos no pueden liberar G5–G7; requieren personas y verificaciones externas. El grafo no clasifica trabajadores ni asigna empleos.

## Qué hace falta para cierre productivo
- **13 graph:** Persistencia temporal, autenticación/RBAC real, políticas por nodo, lineage real, índices de grafo.
- **14 scenario:** Simulador de capacidad real, matching consensuado, validación G5 con identidad, fairness review, datos de disponibilidad.
- **15 output:** Generación de PDF/PPTX/Excel, firmas G6, distribución privada, versiones, accesibilidad y aceptación cliente.
- **16 activation:** PM tool integrations, medidor KPI, firmas sponsor, gate G7, cohort analytics y seguimiento real.
- **17 ops:** Sistema ticketing, facturación, reconciliación bancaria, control proveedores, evaluación NDA/COI y dashboards SLA.
- **18 platform:** SSO, persistencia, auditoría IAM, infraestructura, DR, aislamiento real, cifrado y secret manager.
- **19 economics:** Costos observados por cliente/job, timesheet, renovación, sensibilidad, comparativas de precios y signoff financiero.
- **20 assurance:** Pruebas extremo a extremo, tenant tests, seguridad avanzada, evals agentes, aceptación formal y trazabilidad de datos reales.
