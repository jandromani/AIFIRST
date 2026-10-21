# 14 · Organización y escenarios

**Propietario:** Transformation Lead / RRHH · **Fase:** 05 · INTELIGENCIA · **Estado:** contrato y referencia offline; producción pendiente.

## Propósito
Compara opciones de equipos, formación y ejecución sujetas a preferencias y aprobación humana.

## Entrada y salida
- **Entrada:** Grafo + objetivos + restricciones
- **Salida:** OrganizationScenario v1
- **Aceptación:** Entrada tipada, salida versionada, evidencia y aprobación según riesgo
- **Contratos:** OrganizationScenario, RoadmapItem

## Proceso externo
Sponsor, RRHH y comité eligen prioridades, validan recursos e intereses voluntarios; reciben alternativas con incertidumbres y ninguna reasignación automática.

## Proceso interno
Construir portfolio de iniciativas, verificar muestras, coste por escenario, dependencias y supuestos, comparar tradeoffs y elevar G5 al comité.

## Máquina de estados
`candidate → drafted → co-design → pending_G5 → approved|rejected`

## Condiciones de bloqueo
Atribución individual insuficiente, decisiones laborales automatizadas, coste sin supuestos o G5 sin firma.

## Drivers del precio
Talleres, revisiones RRHH/Legal, escenarios, análisis dependencias.

## Referencia funcional
`draftScenarios`. No es servicio en producción; esta referencia no firma gates ni otorga acceso real.

## Pendiente para operar con clientes
Simulador de capacidad real, matching consensuado, validación G5 con identidad, fairness review, datos de disponibilidad.

## Nodos y criterios de aceptación (fuente: Operating Atlas original)

| Identificador | Componente | Entrada | Salida | Criterio de aceptación |
|---|---|---|---|---|
| `scenario.portfolio` | Selección iniciativas | Ranking soluciones | Portfolio candidato | Cada decisión enlaza evidencia |
| `scenario.matching` | Matching voluntario | Competencias + interés + disponibilidad | Equipos candidatos | Nunca asignación laboral automática |
| `scenario.coverage` | Cobertura capacidad | Skills por iniciativa | Brechas por equipo | No confundir ausencia prueba con ausencia habilidad |
| `scenario.org_options` | Escenarios organización | Opciones y restricciones | 3 modelos contrastables | Pros,contras,incertidumbres |
| `scenario.dependencies` | Dependencias cambios | Equipos,sistemas,formación | Camino crítico | Bloqueantes visibles |
| `scenario.capacity` | Planeación de esfuerzo | Horas,roles y demanda | Capacidad estimada | Verificada con responsables |
| `scenario.business_case` | Caso negocio | Costes,baseline,riesgos | Rangos ROI | Nunca mostrar ROI ficticio como real |
| `scenario.risk_model` | Riesgos transición | Cultura,seguridad,operación | Registro mitigaciones | Dueño por riesgo |
| `scenario.co_design` | Taller validación | RRHH,TI,representación | Escenarios revisados | Opiniones registradas |
| `scenario.committee` | Decisión comité | Alternativas y acta | Opción aprobada o rechazada | Registro humano |
| `scenario.readiness` | Gate escenario | Viabilidad y conformidad | Alternativas publicables | G5 aprobado |
