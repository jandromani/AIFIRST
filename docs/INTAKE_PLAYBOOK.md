# Intake multicanal · versión 0.1

## Regla: preguntar solo lo necesario
Cada formulario tiene identificador, versión, propósito, propietario, fecha, clasificación y procedencia. Documentación y fuentes externas requieren referencia. No enviar datos personales reales por GitHub, correo sin protección o servicios IA no autorizados.

### Entrada A: comerciales (01)
**Quién:** comprador / Growth. **Canal:** formulario, llamada o CRM privado. **Contrato:** `ClientBrief`.
Preguntas: ¿sector y jurisdicciones?, ¿tamaño aproximado?, ¿qué problema de negocio requiere IA?, ¿qué evidencia respalda la necesidad?, ¿qué sponsor puede decidir?, ¿qué equipos participarían?, ¿qué límite de presupuesto?, ¿qué resultados desearían a 90 días?

### Entrada B: Legal / compras (02)
**Quién:** jurídico del cliente / dirección proyecto. **Canal:** firma y repositorio privado. **Contrato:** `EngagementConfig`, `RiskRegister`.
Datos: SOW, prestación, inicio, alcance, finalidades, DPA/exclusión, IP, premios, SLA, responsabilidad, localización/subencargados, plazo de retención, procedimiento de cierre. Si hay un incumplimiento, no avanzar.

### Entrada C: sponsor estrategia (03)
**Quién:** CEO/transformación. **Canal:** entrevista con acta. **Contrato:** `CompanyContext`.
Preguntas: prioridades 12–24 meses, restricciones, estructura agregada, unidades, procesos clave, objetivos de automatización y fuente de la línea base.

### Entrada D: operaciones (03)
**Quién:** responsables de proceso. **Canal:** hoja o formulario estructurado. **Contrato:** `CompanyContext.processes`.
Una fila por proceso: identificador, nombre, owner por rol, frecuencia, volumen, tiempo medio, coste estimado, aplicaciones, incidencias, baseline, fuente, sensibilidad y lagunas.

### Entrada E: tecnología/seguridad (03–04)
**Quién:** CIO/CISO/DPO. **Canal:** cuestionario y revisión. **Contrato:** `CompanyContext` / `RiskRegister`.
Datos: stack, IAM, sandbox, políticas LLM, regiones, proveedores autorizados, prohibiciones, tipos de datos, derechos de acceso, ciclo de vida y terceros.

### Entrada F: diseño de reto (05)
**Quién:** Sponsor y Challenge Lead. **Canal:** taller + plantilla. **Contrato:** `ChallengeBrief`, `Rubric`.
Preguntas: problema medible, baseline, dificultad, recursos, criterios y pesos, fecha, jurado, premios, desempate, accesibilidad y reglas de participación.

### Canales de salida (posteriores)
Informe CEO agregado, portfolio de soluciones, carpeta de evidencias, matriz de oportunidades, escenarios optativos, roadmap 90 días y registro de cierre. Cada salida exige destinatarios autorizados, versión, fuentes y responsable.

## Integridad del proceso
Lead → G0 → SOW/DPA → G1 → ficha + fuentes → riesgos → reto + rúbrica → G2. Ni las entrevistas ni el conocimiento contextual sustituyen una autorización para procesar datos personales. Si faltan datos: registrar `unknown`, no rellenar con invenciones.
