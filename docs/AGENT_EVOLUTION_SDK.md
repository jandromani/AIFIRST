# Agent Evolution OS · SDK / Integration Contract v0.1

Usar esta capa **sin reemplazar** al motor de agentes existente. El adaptador devuelve solo trazas de metadatos, no prompts, completions ni identidades de personas.

## Ejemplo canónico

```json
{
  "schema": "aifirst.evolution.trace.v1",
  "source": "LANGGRAPH",
  "external_id_hash": "<sha256>",
  "task_id": "task_<uuid>",
  "agent_id": "agent_<uuid>",
  "metrics": { "quality": 0.83, "reliability": 0.95, "safety": 1.0, "cost_eur": 0.05, "latency_ms": 630 },
  "trust": "UNVERIFIED_EXTERNAL",
  "used_for_promotions": false
}
```

`adapterEnvelope` genera el contrato y rechaza escalas, referencias y proveedores no declarados. El API `POST /v1/evolution/traces` exige token de admin/auditor de tenant y referencias a tarea y agente existentes en **ese** tenant. El contenido enviado por el propio agente nunca se convierte en una evidencia evaluativa verificada; para los ascensos hay que registrar la comparación a través de `EvolutionOS.arena()` con un callback externo independiente permitido por el host, **no con una petición al API público**.

## Pipelines conectados al Operating Atlas

| Competencia | Dominios |
|---|---|
| DISCOVERY | 01,03,05,14 |
| HACKATHON | 06,07,08,09,10,11 |
| EVIDENCE | 09,11,12,13 |
| REPORTS | 13,14,15,16 |
| SECURITY | 02,04,09,18,20 |
| WEB_UX | 01,06,15,20 |
| OPERATIONS | 07,10,16,17 |
| INTEGRATIONS | 08,10,17,18 |
| FINANCE_DRAFT | 01,17,19 |

## API local

| Route | Acción |
|---|---|
| GET `/v1/evolution/status` | ¿Inicializado el tenant? |
| POST `/v1/evolution/init` | Iniciar sistema por tenant (admin) |
| POST `/v1/evolution/demo` | Sembrar y ejecutar demo sintética **únicamente** (admin) |
| GET `/v1/evolution/snapshot` | Leer plantilla, mercado y constitución (admin/sponsor/auditor/security) |
| GET `/v1/evolution/league` | Liga y reconocimiento semanal, resultados de arena locales |
| GET `/v1/evolution/mirrors/GOD` | Informes críticos privados (solo auditor/security) |
| POST `/v1/evolution/agents` | Registrar agentes, opcional clave pública Ed25519 |
| POST `/v1/evolution/positions` | Abrir puesto |
| POST `/v1/evolution/vacancies` | Anunciar empleo por cuatro días |
| POST `/v1/evolution/applications` | Presentar prompt versión candidata |
| POST `/v1/evolution/tasks` | Trabajo con sujeto referenciado por SHA, sin contenido crudo |
| GET `/v1/evolution/candidate-feed/:capability` | Trazas anonimizadas disponibles para candidatos, nunca críticos privados |
| GET `/v1/evolution/recommendations` | Propuestas del orquestador solo desde su canal visible |
| POST `/v1/evolution/swarm` | Ejecutar hasta 3 agentes concurrentes con OpenRouter Free y datos sintéticos, pendientes de revisión |
| POST `/v1/evolution/plan` | Planificar/adjuntar agente a una cadena de competencias en demo |
| POST `/v1/evolution/run-task` | OpenRouter Free: metadatos sintéticos, salida sin aprobación |
| POST `/v1/evolution/critique` | Informe espejo firmado, canal fijado según objetivo |
| POST `/v1/evolution/challenge` | Propuesta de nueva constitución con censo sellado |
| POST `/v1/evolution/vote` | Papeleta firmada por agente activo del censo |
| GET `/v1/evolution/ballots/:proposal` | Conteo y unanimidad |
| POST `/v1/evolution/approve-belief` | Gate independiente (auditor/security) |
| POST `/v1/evolution/enact-belief` | Enactuar nueva versión (admin) |
| POST `/v1/evolution/propose-promotion` | Propuesta posterior a arena validada |
| POST `/v1/evolution/approve-promotion` | Gate independiente de promoción |
| POST `/v1/evolution/activate-promotion` | Promoción de canary local |
| POST `/v1/evolution/rollback` | Restituir titular previo |

No existe endpoint para otorgar privilegios al modelo, imponer sanciones a personas, gastar dinero, autopromocionarse, descubrir pruebas ocultas o modificar el `BELIEF_ROOT_POLICY`. **La calificación ciega no la realiza el orquestador.**
