# Operating model · AIFIRST

## Promesa acotada
Hackatón → soluciones comparables y trazables → evidencias de capacidades **observadas** → oportunidades y escenarios revisables → roadmap con responsables. No es prueba exhaustiva de plantilla ni predicción automática de rendimiento.

## Flujo comercial a lanzamiento
```text
01 Lead → ClientBrief → SalesQualification → PricingQuote → [G0]
02 Propuesta → SOW / DPA / IP / premios / SLA / salida → EngagementConfig → [G1]
03 Encuesta sponsor + fuentes → CompanyContext + RiskRegister
04 Decisiones DPO/Legal/Comité → información, minimización, acceso, retención, revisión
05 Banco de problemas → ChallengeBrief → Rubric congelada → [G2] → Convocatoria
```

## Canales admitidos, con un contrato por detrás
- Formulario: respuestas a ClientBrief, CompanyContext o ChallengeBrief; extracción validada y registro de fuente.
- Hoja de cálculo: importación controlada de inventario de procesos y baselines (no identidad nominativa por defecto).
- Reunión/entrevista: acta verificada por sponsor y referencia de origen.
- Correo corporativo: notificaciones y confirmaciones; no repositorio de evidencias sin control.
- Drive/SharePoint/S3: evidencias y archivos protegidos, hashes y accesos por tenant (futuro).
- API/MCP: solo cuando haya autenticación y política de permisos.
- Firma/revisión legal: decisión manual con referencia de acta, fuera del LLM.
- Jurado: canal independiente, NDA, conflictos, réplica y discrepancias (fase posterior).

## Dueños
CEO/Growth: oportunidad y G0. Legal/DPO: contrato, usos y riesgos. Sponsor: objetivos, datos y valor. Challenge Lead: rúbrica, jurado y G2. Responsable técnico: aislamiento y tratamiento. Comité cliente: decisiones sobre organización y personas.

## Restricciones duras
Nunca se enviarán datos reales a una IA o nube no autorizada. Nunca se ejecutará código de terceros sin sandbox de seguridad revisado. No se infiere el valor profesional de individuos desde la nota del equipo. La aprobación de un gate necesita una persona responsable y un registro verificable, no texto generado por un agente.

## Estados
LEAD → QUALIFIED → CONTRACTED → CONTEXT_VALIDATED → CHALLENGE_APPROVED → OPEN. Una fase fallida debe bloquear la siguiente, documentando remediación y nueva revisión.

## Outputs por fase
01: oportunidad y precio explicable. 02: contrato y responsabilidades. 03: diagnóstico contextual con lagunas. 04: matriz de protección y revisión. 05: reto con éxito verificable y rúbrica congelada.

## Después de G2
Inscripción y contribuciones pseudonimizadas → recepción y cuarentena de entregables → pruebas deterministas → evaluación agéntica basada en evidencia → revisión de jurado → portfolio de soluciones → grafo de oportunidades → escenarios con decisión humana → roadmap → medición 30/60/90 → exportación y borrado.
