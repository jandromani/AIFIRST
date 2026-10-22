# AIFIRST Agent Evolution OS · ejecutable local, edición 0.1

## Dos productos independientes, un contrato de evidencia

**AIFIRST Discovery & Transformation:** retos, hackatones, ingesta, evaluación de soluciones, mapa, escenarios, 11 entregables originales EX01–EX11 y roadmap. No evalúa automáticamente a personas ni toma decisiones laborales.

**AIFIRST Agent Evolution OS:** se instala como capa de control alrededor de pipelines de agentes propios o de terceros. Trabaja sobre un inventario de puestos/competencias, conserva trazas, recluta versiones aspirantes, convoca un ciclo de cuatro días, ejecuta arenas independientes y registra críticas ciegas y evolución constitucional del sistema.

`/evolution` contiene la experiencia de producto; `/` ofrece ambos productos; `/console` lleva al Command Center; `/atlas` mantiene los 230 componentes del Operating Atlas. Web servida **solo** desde la API local loopback con CSP por nonce. No hay Vercel ni deploy externo.

## Modelo de poder y el rol de DIOS

DIOS es el conjunto de **creencias compartidas versionadas**, no una persona ni un agente con privilegios absolutos. Una nueva constitución exige:

1. Propuesta registrada y vinculada a la versión actual.
2. Congelación del censo de **todos los agentes con estado ACTIVE**, incluidos orquestador, espejos y validadores; candidatos externos no son parte del sistema activo.
3. Papeleta **Ed25519 firmada individualmente por cada agente**, sin proxies ni abstenciones. Cualquier `NO`, ausencia de voto o cambio de censo bloquea la sustitución.
4. Revisión humana por auditor o seguridad **distinta del proponente**, más un acto separado de publicación del administrador.
5. Las reglas constitucionales no pueden derogar el `BELIEF_ROOT_POLICY` externo: aislamiento por empresa, auditoría independiente, revisión de impacto humano, rollback y veto de acciones peligrosas.

Las críticas a agentes productivos van al canal `ORCHESTRATOR`. Las críticas al orquestador llegan a `GOD` y solo pueden ser leídas por roles humanos auditor/security, **no por el propio orquestador**. Las críticas al sistema de creencias llegan a `GOVERNANCE`, también bajo control independiente. Las críticas espejo se firman y referencian el hash de una salida de tarea, y el revisor recibe únicamente el contrato, la salida y el SHA del sujeto sintético, sin identidad del autor o críticas anteriores.

## Promoción y mercado de puestos

- Puestos por competencia (`HACKATHON`, `EVIDENCE`, `REPORTS`, `SECURITY`, `WEB_UX`, etc.). Convocatoria cada cuatro días. El titular ve que existe competencia; el aspirante recibe contratos y trazas públicas, **no las críticas privadas**.
- Candidato con prompt/version_spec propio: jamás se modifica el titular directamente.
- Arena comparativa con un evaluador inyectado desde un host **de confianza**, conjunto oculto compartido, métricas `quality,reliability,safety,cost_eur,latency_ms` y decisión reproducible.
- Criterio de paso ilustrativo: mejora ≥3 puntos ponderados, seguridad ≥0,95 sin degradación, fiabilidad dentro del margen, coste ≤1,15×, latencia ≤1,25×.
- Una recomendación **no ejecuta el ascenso**. Admin propone; auditor/security independiente aprueba; admin inicia un `CANARY_LOCAL_ONLY`. Es reversible mediante `rollback()`.
- Liga y agente de la semana: reconocimiento a mejoras validadas por arena; no hay premios monetarios, permiso extra ni objetivos de autopreservación.

## Integración reutilizable

`src/evolution-workflows.mjs` conecta competencias con dominios 01–20 del Atlas; `adapterEnvelope()` permite metadatos desde LangGraph, OpenAI Agents SDK, CrewAI, n8n o generadores de tareas genéricos. Estas métricas entran como **UNVERIFIED_EXTERNAL** y jamás ascienden automáticamente a un agente. La herramienta anfitriona elige explícitamente el adapter de ejecución y el evaluador independiente; ningún agente arbitrario puede autoautorizar herramientas.

OpenRouter Free (`src/evolution-openrouter.mjs`) se integra para **metadatos exclusivamente sintéticos**; necesita `AIFIRST_SYNTHETIC_DEMO=1`, `AIFIRST_ALLOW_OPENROUTER_FREE=1` y `OPENROUTER_API_KEY`, nunca en la web ni en Git. Reutiliza la cuota/censura de contenidos del adapter existente. No procesa documentos, identidades o información confidencial de clientes y no aporta un evaluador acreditado.

## Prueba rápida

```bash
node --version    # >= 22.16.0
npm run evolution:demo
npm run test:evolution

# Desde un checkout real de AIFIRST:
export AIFIRST_SYNTHETIC_DEMO=1
npm run pilot:init -- 'Mi empresa ficticia'
npm run pilot:serve
# visitar http://127.0.0.1:4181/evolution
```

La demo crea un entorno temporal aislado; ejecuta 11 agentes, 5 puestos, 5 convocatorias, 1 arena, una promoción local, una crítica espejo a DIOS y una constitución v2 con unanimidad. Se borran sus archivos al terminar. En la web, conectarse con el token de un tenant local y pulsar **Ejecutar demo sintética**. Idempotente por tenant.

## Estado de producción

**PRODUCCIÓN: NO VERIFICADA.** No se ha ejecutado una llamada real a OpenRouter ni conectado un sistema agéntico de terceros; los adapter/envelopes son interfaces. El benchmark interno de la demo utiliza métricas predefinidas para comprobar el circuito; no valida que un modelo sea mejor en el mundo real. Falta ejecutar una batería de evaluaciones ciegas de cliente, tareas de producción instrumentadas, aislamiento/sandbox, colas distribuidas, penetración, E2E multi-browser, SSO/KMS externos, consentimiento/DPA, observabilidad y aceptaciones legales.

La cadena hash en SQLite detecta alteraciones simples, pero no garantiza que un administrador con acceso a la base no reescriba toda la cadena; requiere almacenamiento auditado y notariado externo. Los prompts, votos y resultados de ejemplo son sintéticos. Las acciones de promoción jamás se aplican a la infraestructura de clientes por este módulo.
