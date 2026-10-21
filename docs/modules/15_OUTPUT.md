# 15 · Informes y exportaciones

**Propietario:** Delivery Lead / Comité cliente · **Fase:** 06 · ENTREGAR · **Estado:** contrato y referencia offline; producción pendiente.

## Propósito
Mismo paquete de salida reproducible, por audiencia, con trazabilidad y restricciones.

## Entrada y salida
- **Entrada:** Evaluación, grafo y escenarios
- **Salida:** DeliverableBundle versionado
- **Aceptación:** Entrada tipada, salida versionada, evidencia y aprobación según riesgo
- **Contratos:** DeliverableManifest, RoadmapItem

## Proceso externo
Dirección recibe informe y portfolio con datos agregados; IT anexo técnico; RRHH/participantes únicamente materiales autorizados. Se ofrece exportación y rectificación.

## Proceso interno
Aplicar plantillas por audiencia; validar claims, referencias y limitaciones; redactar artefactos deterministas; producir manifest; validar aprobaciones G6, distribuir por canal seguro.

## Máquina de estados
`draft → internal_review → client_review → signed_G6 → distributed`

## Condiciones de bloqueo
Informe sin fuente, PII para CEO, audiencia no autorizada, contenido no firmado.

## Drivers del precio
Nº entregables, maquetación, revisión ejecutiva, export, traducciones.

## Referencia funcional
`prepareExecutiveBundle (Markdown + manifest)`. No es servicio en producción; esta referencia no firma gates ni otorga acceso real.

## Pendiente para operar con clientes
Generación de PDF/PPTX/Excel, firmas G6, distribución privada, versiones, accesibilidad y aceptación cliente.

## Nodos y criterios de aceptación (fuente: Operating Atlas original)

| Identificador | Componente | Entrada | Salida | Criterio de aceptación |
|---|---|---|---|---|
| `output.ceo_pdf` | CEO Executive Report | Hechos y oportunidades | PDF ejecutivo | KPIs con fuente y nivel confianza |
| `output.board_deck` | Board Pack | Resumen decisiones | Presentación dirección | No trasladar ranking personal |
| `output.graph_html` | Graph Explorer | Datos autorizados | Atlas interactivo | RBAC y export sin PII indebida |
| `output.portfolio` | Portfolio de soluciones | Evaluación y viabilidad | Fichas de proyectos | Dueño y riesgos visibles |
| `output.roadmap` | Roadmap 30/60/90 | Escenario elegido | Backlog priorizado | Owner,dependencia,KPI,gate |
| `output.teams` | Equipos candidatos | Matching revisado | Propuesta de colaboración | Acceso limitado a RRHH y interesados |
| `output.skills` | Capability Atlas | Evidencias agregadas | Mapa capacidades | Cobertura y límites declarados |
| `output.risk` | Riesgos y controles | Hallazgos y mitigaciones | Registro de riesgo | Responsables y fechas |
| `output.technical` | Technical Annex | Tests,trazas,SBOM | Apéndice técnico | Reproducible y versionado |
| `output.participant` | Feedback privado | Contribución revisada | Informe personal opcional | Nunca compartido globalmente |
| `output.api_export` | JSON / CSV / API | Dataset autorizado | Export interoperable | Contratos versionados |
| `output.jira_export` | Roadmap → PM tools | Work packages | Tickets opt-in | Escrituras con aprobación explícita |
| `output.signoff` | Aceptación cliente | DeliverableManifest | Acta y control versiones | G6 y aceptación formal |
