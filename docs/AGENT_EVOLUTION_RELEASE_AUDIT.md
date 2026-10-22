# Agent Evolution OS — release due diligence 0.3

**Build reproducible:** `npm run test:evolution:extended`, `npm run evolution:integrated`, `npm run test:evolution:visual`. En el entorno de construcción: **44/44 tests Node pasados** sobre la selección existente (no toda la suite histórica del repo, que requiere checkout completo), **3/3 viewports** en prueba Chromium estática (1440×900, 390×844, 320×720; sin overflow ni excepciones de página). No equivale a E2E browser con API real autenticada, Firefox/Safari ni WCAG AA.

## Matriz de integración

| Capacidad | Código ejecutable | Pruebas | Pendiente de cliente/proveedor |
|---|---|---|---|
| Hackathon → swarm | SHA bridge, idempotencia, control de G3 local y tenant | Unit + HTTP + demostración | DPA, seguridad de documentos, validación externa G3 |
| Crítica espejo | Blind packet, firma independiente, canales privados, rechazo de suplantación | Firma real Ed25519 en Node | PKI/gestión de identidad de servicio y pruebas de adversarios |
| DIOS | Constitución versionada, censo congelado, unanimidad firmada y aprobador separado | Escenarios afirmativos/negativos | Custodia de claves, gobernanza jurídica, auditoría externa |
| Evolución | Vacantes 4 días, candidaturas, arena, promoción y rollback | Benchmark host + flujo completo | Modelos de evaluación realmente independientes y clientes piloto |
| Orquestador | Tareas concurrentes, recomendaciones y propuestas de mejora | Swarm y tests del planner | Planificación autónoma supervisada, presupuestos reales, métricas SLO |
| SDK | Contrato canónico de trazas, adaptadores descritos y pruebas | Contratos/JSON | Integración E2E en LangGraph/CrewAI/OpenAI Agents/n8n de terceros |
| UX | Landing dual-producto, Command Center y Evolution workspace con bridge | Chromium estático | Autenticación/UI E2E, accesibilidad y usabilidad con personas |
| Comercial | Descripciones de dos SKUs y límites honestos | Evaluación documental | Primer cliente, consentimientos, CRM real, ventas, pagos (se posponen) |

## Riesgos y mitigaciones

- **Goodhart/reward hacking:** comparar salidas con casos ocultos y controles externos; nunca promocionar con métricas reportadas por agentes.
- **Colusión/quorum capturado:** voto individual firmado de todos los agentes activos + humano separado; requieren identidad y antisuplantación reales antes de producción.
- **Privacidad:** motor solo recibe SHA-256 y metadatos sintéticos. Trazas externas no son fuente de verdad; GOD permanece privado.
- **Autonomía irresponsable:** los agentes pueden proponer y experimentar en local, pero no tienen permisos de despliegue externo, movimiento de dinero o decisiones laborales.
- **Auditabilidad:** hash chain local detecta cambios pero **no** es WORM externo; deben añadirse sellado fiable y custodia independiente.
- **Integridad del release:** aunque los tests nuevos pasan, debe verificarse `npm run verify:local` desde un checkout completo y ejecutar CI de seguridad antes de publicar software customer-facing.

**Conclusión:** segundo producto técnicamente integrado en modo local sintético, no enterprise release. No cerrar issues de producción únicamente por la existencia de código.
