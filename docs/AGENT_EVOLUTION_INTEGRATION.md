# AIFIRST / Discovery ⇆ Agent Evolution OS · vertical integrado

**Versión:** 0.3 / 2026-10-22 · **Ámbito:** desarrollo local con datos y evidencias sintéticos. **No** sistema enterprise homologado.

## Dos productos y una capa reutilizable

- **Discovery & Transformation:** intake, evidencia, entregables EX01–EX11 y gates G0–G7. Sigue siendo el responsable del contrato, licitud y confidencialidad.
- **Agent Evolution OS:** swarm, puestos, trazas, espejos ciegos, juicio independiente, competición, DIOS versionado, revisión humana, canary local y rollback. No toma decisiones sobre trabajadores ni mueve dinero.
- **EvolutionFabric:** puente de referencias SHA-256 `submission -> evo_task` con control de tenant, registro SQLite, idempotencia, rechazo de alteración de manifiesto y verificación previa G3 local y estado `CLEAN` en todos los artefactos. El puente **no mueve bytes**, correos, identidades ni documentos a modelos externos.

## Prueba de extremo a extremo

```bash
node --version                      # >=22.16
npm run test:evolution             # 23 pruebas Node con SQLite/HTTP reales
npm run test:evolution:extended    # 44 pruebas Node disponibles en el entorno reconstruido
npm run evolution:integrated       # demo íntegra con prueba de arena independiente
npm run test:evolution:visual      # Chromium desktop + móviles; requiere playwright y Chromium
```

`evolution:integrated` usa un directorio temporal y crea solo datos sintéticos: edición, envío, recibo de AV ficticio identificado como tal, revisión G3 local no jurídica, agente productivo, espejo con clave de prueba, aspirante y arena. Una evaluación por respuestas ocultas impulsa un ascenso canary *local* sujeto a aprobación del rol auditor. A continuación se propone una mejora, se verifica el ledger y se destruye el directorio temporal. `production_release: false` siempre.

El puntaje alto de un aspirante **no basta**: seguridad, fiabilidad, coste y latencia limitan la promoción. Una métrica recibida por LangGraph/CrewAI/n8n es inicialmente `UNVERIFIED_EXTERNAL`, no un certificado de mejora. Los casos y respuestas esperadas del benchmark viven fuera del prompt del candidato. La arena no ejecuta código no confiable de terceros.

## API tenant-scoped

Autenticación bearer local/ OIDC configurado mediante la API existente (servidor **solo loopback**):

- `POST /v1/evolution/init` / `POST /v1/evolution/demo`: inicialización y ejemplo completamente ficticio.
- `GET /v1/evolution/snapshot`, `league`, `audit`, `fabric`, `improvements`, `recommendations`.
- `POST /v1/evolution/bridge` `{ "submission":"sub_...", "capability":"HACKATHON" }`: enlazar solo si la entrega tiene *todos* los artefactos `CLEAN` + recibos de escáner + gate G3 local registrado. La respuesta contiene `task`, `assigned_agent`, `idempotent`.
- `POST /v1/evolution/bridge-run`: puente más ejecución sintética por OpenRouter Free, únicamente con metadatos de prueba; requiere clave y configuración. El resultado **no está revisado**.
- `POST /v1/evolution/mirror-round` `{ "task":"task_...", "mirror":"agent_...", "severity":"HIGH", "report":"...", "signature":"..." }`: firma Ed25519 creada por el **crítico independiente**, comprobada en el servidor con su clave pública. El payload firmado es `MIRROR:v1:<tenant>:<mirror>:<task>:AGENT:ORCHESTRATOR:<severity>:<sha256(report)>`. No aceptar la firma del propio agente productivo.
- `POST /v1/evolution/job-board-tick`: renueva puestos vencidos transcurridos cuatro días, sin contratar automáticamente.
- `POST /v1/evolution/improvement-proposal` `{ "position":"pos_...", "reason":"...", "source":"ORCHESTRATOR", "action":"RECRUIT_CHALLENGER" }`: propuesta sin efecto ejecutivo, gate humano pendiente. `source=GOD` se reserva para auditor o seguridad.
- `GET /v1/evolution/candidate-feed/:capability`: estadísticas saneadas de trazas; excluye deliberadamente críticas privadas y fixtures.

## Separación de poderes y el reemplazo de DIOS

DIOS es la **constitución versionada** del swarm, no un agente omnipotente. Todos los agentes activos que componen el censo congelado —orquestador, productivos, espejos y validadores— deben emitir voto **individual firmado** por Ed25519. Un NO, una abstención, una clave inexistente o una modificación del censo impiden sustituirlo. La unanimidad no elude el gate humano independiente. El quorum nunca puede reemplazar políticas externas de privacidad, seguridad, no decisión laboral ni rollback.

Los informes `GOD` y `GOVERNANCE` no pueden ser leídos desde el canal del orquestador. `mirrorRound` genera críticas ordinarias de AGENT y canal ORCHESTRATOR; críticas sobre el orquestador emplean el endpoint original `critique` con canal GOD y firma válida.

## Por qué esto no es el 100 % empresarial

- [ ] Cuenta y política de datos de proveedor LLM externo (OpenRouter gratuito, solo **synthetic metadata** hasta revisión formal).
- [ ] Identidades de servicio y claves privadas custodiadas en KMS/HSM. Las claves efímeras de la demo **no** son aptas para producción.
- [ ] Arena certificada con casos externos aceptados, evaluador independiente y métricas facturadas, protección ante manipulación de benchmarks y sesgos.
- [ ] Sandbox comprobado, DLP/AV homologados, IAM corporativo, observabilidad y almacenaje WORM externo.
- [ ] Escalado HA multiempresa, copias fuera del nodo, recuperación y retención; hosting público y TLS.
- [ ] Prueba piloto autorizada con datos reales, firmantes con poderes reales y revisiones de DPO/legal/seguridad.
- [ ] Pruebas manuales WCAG y estudios reales con compradores y usuarios.

**Política de cierre:** el cableado **interno local** puede darse por comprobado cuando los tests pasen. Los gates G1/G3–G7, la validez de las métricas externas y los issues de producción siguen abiertos hasta aportar evidencias externas reales.
