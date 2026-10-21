# Entrega 06–12 · Definición de cierre

**Cierre de definición:** contratos, modelo y procesos completos para 06–12; fixtures sintéticos y componentes locales de referencia.
**Cierre de producto para datos reales:** NO. Requiere seguridad, infraestructura, responsables y autorización externa.

| Módulo | Contrato de entrada y salida | Prototipo offline | Despliegue real |
|---|---|---|---|
| 06 Canales y comunicaciones | DeliveryMessage, EventEnvelope | comms.notifications | Bloqueado; Integraciones email/Teams/Slack/Calendar |
| 07 Participantes y equipos | ParticipantRegistration, TeamRoster | people.team | Bloqueado; SSO real y alias↔identidad segregada |
| 08 Entregas y evidencias | SubmissionManifest, IntakeReceipt | submission.readme, submission.freeze | Bloqueado; Adaptadores Drive/SharePoint/S3 |
| 09 Ingesta y normalización | IntakeReceipt, NormalizedPackage, EvidenceClaim | normalize.schema, normalize.hash, normalize.reject, normalize.accept | Bloqueado; AV real con prueba |
| 10 Motor de ejecución | JobSpec, AgentTrace, EventEnvelope | orchestrate.scheduler, orchestrate.budget, orchestrate.retry | Bloqueado; worker real + cola duradera |
| 11 Evaluación de soluciones | Rubric, EvidenceClaim, EvaluationResult, JuryReview | evaluate.tech_quality, evaluate.jury_review, evaluate.solution_rank, evaluate.signoff | Bloqueado; identidad/jurado independiente verificados |
| 12 Evidencia de capacidades | EvidenceClaim, CapabilityEvidence, CapabilityAggregate | capability.claim, capability.attribution, capability.uncertainty, capability.aggregates, capability.human_review | Bloqueado; revisión real por persona habilitada |

## Ruta completa requerida

**G2 aprobado y verificado →** campaña de comunicación → participantes activos → entrega congelada → hash y cuarentena → AV/PII/secrets → **G3 humano verificable →** jobs y sandbox → claims reproducibles → jurado independiente → **G4 firmado →** observaciones de capacidades, revisión y agregación protegida.

La edición ficticia no puede desbloquear G3/G4 reales. No se envían mensajes, no se ejecuta código, no se invocan modelos y no se califican personas.

## Condiciones de cierre de cada módulo

### 6. Canales y comunicaciones
**Owner:** Community / Customer Success. **Input:** ChallengeBrief publicado, audiencias por rol, plantilla versionada, opt-out, aprobación de canal. **Output:** DeliveryMessage, EventEnvelope, incidencias y estado de entrega.

**Proceso externo:** El cliente decide canales autorizados y aprueba idioma/horarios; participantes reciben una versión única del mensaje y soporte accesible.

**Proceso interno:** Preparar plantilla, resolver audiencia sin exponer listado, validar propósito, generar idempotency key, encolar, gestionar rebotes y confirmaciones, conservar trazas mínimas.

**Estados:** draft → reviewed → queued → sent|suppressed|failed → archived.

**Gate de bloqueo:** Canal sin autorización; mensaje con secreto; SMS sin aprobación; duplicados.

**Aceptación:** No notificar dos veces; sin exponer datos; acceso multilingüe; evidencia de entrega desde proveedor.

**Drivers de coste:** Nº mensajes, idiomas, soporte/tickets, SMS, reuniones

**Existe en el motor offline:** comms.notifications.

**Pendiente para producción:** Integraciones email/Teams/Slack/Calendar; webhooks firmados y recibos; consentimientos y preferencias privadas; portal WCAG verificado.


### 7. Participantes y equipos
**Owner:** Operaciones / Responsable cliente. **Input:** Reglas G2, invitación, identidad autorizada, consentimiento o legitimación aplicable, elegibilidad, preferencias. **Output:** ParticipantRegistration y TeamRoster pseudonimizados.

**Proceso externo:** Inscripción accesible, información de usos y derechos, elección de participación, composición de equipos y posibilidad de rectificación.

**Proceso interno:** Verificar elegibilidad con cliente, registrar aceptación, crear alias en almacén privado, gestionar asignación y roles, verificar cambios/retirada, limitar visibilidad.

**Estados:** invited → informed → eligible → active|withdrawal_review → closed.

**Gate de bloqueo:** Registro sin aviso; alias duplicado; equipo incoherente; uso de dato sensible en scoring.

**Aceptación:** Roster sin duplicados y sin identidad nominativa en capas de evaluación; cambios trazados.

**Drivers de coste:** Inscripciones, soporte, SSO, revisiones jurídicas y accesibilidad

**Existe en el motor offline:** people.team.

**Pendiente para producción:** SSO real y alias↔identidad segregada; gestión de derechos y bajas real; gestión de consentimientos/preferencias por ley; validación de condiciones laborales.


### 8. Entregas y evidencias
**Owner:** Challenge Ops / Participantes. **Input:** Reto y rúbrica fija, participante/equipo válido, materiales, licencias y pruebas. **Output:** SubmissionManifest y snapshot contenido con huellas verificables.

**Proceso externo:** El equipo rellena formulario/manifiesto, entrega README y artefactos en carpeta privada, recibe comprobante y puede corregir dentro de plazo.

**Proceso interno:** Comprobar equipo/fecha, fijar snapshot, verificar rutas/hashes, licencia y contribuciones declaradas, emitir recibo con estado.

**Estados:** draft → uploaded → frozen → received → quarantined|rejected|accepted.

**Gate de bloqueo:** Ruta insegura, symlink, digest incorrecto, falta README o licencia incoherente.

**Aceptación:** Toda entrega tiene ID, fecha, manifiesto, hash, archivos y motivos de rechazo.

**Drivers de coste:** Volumen bytes, número archivos, proveedores almacenamiento, soporte

**Existe en el motor offline:** submission.readme, submission.freeze.

**Pendiente para producción:** Adaptadores Drive/SharePoint/S3; recibo persistente y reloj fiable; control de versiones/deduplicación privada; licencias y propiedad intelectual revisadas.


### 9. Ingesta y normalización
**Owner:** Data Engineering / Security. **Input:** Manifiestos y archivos no confiables. **Output:** NormalizedPackage, EvidenceClaim, incidencias, trazabilidad y dictamen G3.

**Proceso externo:** Cliente conoce archivos rechazados y pasos de corrección, sin revelar datos de otro cliente.

**Proceso interno:** Validar contrato, comprobar rutas e integridad, ejecutar AV/secret/PII en infraestructura controlada, clasificar, extraer, crear fuentes con localizador y preparar G3.

**Estados:** received → quarantined → scanned → canonicalized → G3_pending → approved|rejected.

**Gate de bloqueo:** Escaneo desconocido o fallido; secretos detectados; permisos ambiguos; referencias rotas.

**Aceptación:** Cero ejecución de binarios antes de G3; hash y linaje verificables; doble control humano.

**Drivers de coste:** Archivos, tamaños, AV, OCR/parsers, revisiones manuales

**Existe en el motor offline:** normalize.schema, normalize.hash, normalize.reject, normalize.accept.

**Pendiente para producción:** AV real con prueba; secret/PII scanners aprobados; extracción PDF/video y quality metrics; G3 firma externa verificada; storage privado multi-tenant.


### 10. Motor de ejecución
**Owner:** AI Platform Lead. **Input:** NormalizedPackage con G3 firmado, JobSpec, presupuesto y política. **Output:** AgentTrace, logs auditables y resultados parciales.

**Proceso externo:** El cliente puede consultar progreso agregado, límites de costes e incidencias, nunca prompts sensibles sin permiso.

**Proceso interno:** Planificar DAG, fijar idempotencia, evitar duplicados, asignar presupuesto/tenant, ejecutar pruebas en sandbox real, recoger trazas, manejar retry y veto.

**Estados:** created → queued → running → completed|failed|blocked → reviewed.

**Gate de bloqueo:** G3 no verificado, presupuesto agotado, ejecución no aislada, modelo no aprobado.

**Aceptación:** Rerun reproducible, costes imputables y ejecución imposible sin autorización.

**Drivers de coste:** Tokens, CPU, RAM, duración, sandboxes, reintentos, observabilidad

**Existe en el motor offline:** orchestrate.scheduler, orchestrate.budget, orchestrate.retry.

**Pendiente para producción:** worker real + cola duradera; sandbox aislado sin red; gateway de modelos aprobado; OTEL/ledger inmutable; control identidad gate G3.


### 11. Evaluación de soluciones
**Owner:** Quality Lead / Jurado externo. **Input:** Rubric congelada, SubmissionManifest, claims verificados, resultados pruebas y revisiones. **Output:** EvaluationResult, JuryReview, discrepancias y G4.

**Proceso externo:** Participantes conocen criterio, ven evidencia aplicable a su proyecto y disponen de canal de impugnación.

**Proceso interno:** Relacionar criterio con fuentes, calcular nota provisional de SOLUCIÓN, bloquear si faltan claims, analizar desacuerdo, solicitar evaluación externa, resolver objeciones y firmar G4.

**Estados:** not_scored → draft → evidence_required|jury_pending → appeal_pending → signed|rejected.

**Gate de bloqueo:** Criterio sin fuente; jurado recusado; rubric drift; fallo seguridad; firma no comprobada.

**Aceptación:** Ninguna nota huérfana; comparar solo retos/rúbricas/niveles compatibles con G4 real.

**Drivers de coste:** Jueces, doble lectura, pruebas, seguridad, recursos reclamaciones

**Existe en el motor offline:** evaluate.tech_quality, evaluate.jury_review, evaluate.solution_rank, evaluate.signoff.

**Pendiente para producción:** identidad/jurado independiente verificados; resolución de discrepancias y recursos; criterios evaluados por motor real; G4 firma auténtica y publicación auditable.


### 12. Evidencia de capacidades
**Owner:** People Analytics / Comité cliente. **Input:** Aportes corroborados, EvidenceClaim independientes, finalidad autorizada y preferencias. **Output:** CapabilityEvidence contextualizado y CapabilityAggregate con supresión.

**Proceso externo:** Cada participante autorizado puede revisar su observación y solicitar corrección; dirección solo ve métricas agregadas permitidas.

**Proceso interno:** Cruzar fuente + autoría corroborada + taxonomía, registrar incertidumbre/no respuesta, excluir ámbitos sensibles, enviar a revisión humana, agregar con umbral y retención.

**Estados:** proposed → awaiting_review → approved|disputed|withdrawn → aggregated.

**Gate de bloqueo:** Atribución solo grupal; ausencia de consentimiento/base legal; mostrar grupos <k; uso para decisión laboral automática.

**Aceptación:** No inferir nivel de plantilla; evidencia trazada, revisión, privacidad y métricas de cobertura.

**Drivers de coste:** Revisiones, taxonomía, DPO, reclamaciones, informes

**Existe en el motor offline:** capability.claim, capability.attribution, capability.uncertainty, capability.aggregates, capability.human_review.

**Pendiente para producción:** revisión real por persona habilitada; taxonomía de skills validada; derechos y borrado; modelo población/missingness robusto; propuesta de formación validada.


## Datos y privacidad
La clasificación de soluciones no es valoración laboral. La competencia de cada participante requiere evidencia individual independiente, revisión humana, finalidad legal y capacidad de corrección. No se publican rankings de personas, ni se extrapola el resultado de voluntarios a toda la plantilla.

## No confundir estados
- DESIGN: especificado y conectado en grafo.
- PROTOTYPE_OFFLINE: comportamiento demostrable con fixtures sin conexiones reales.
- VERIFIED_PRODUCTION: pruebas, identidad, permisos, seguridad y aprobaciones con evidencias de auditoría.

Ningún nodo de 06–12 está aún acreditado como VERIFIED_PRODUCTION.
