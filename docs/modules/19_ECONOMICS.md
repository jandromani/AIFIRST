# 19 · Pricing y unit economics

**Propietario:** CFO / Growth · **Fase:** 08 · OPERAR · **Estado:** contrato y referencia offline; producción pendiente.

## Propósito
Catálogo de SKU y cálculo de costes según complejidad y exposición a riesgos.

## Entrada y salida
- **Entrada:** Alcance, volumen y costes
- **Salida:** PricingQuote y margen real
- **Aceptación:** Entrada tipada, salida versionada, evidencia y aprobación según riesgo
- **Contratos:** PricingQuote

## Proceso externo
El comprador recibe oferta con límites de participantes, entregables, premios, addons, supuestos y costes del cliente separados.

## Proceso interno
Medir horas directas, jurado, premios, cómputo, seguridad, contingencia; calcular margen y sensibilidad; aprobar cotización G0 y controlar cambios.

## Máquina de estados
`draft → costed → risk_review → approved_G0 → invoiced → analyzed`

## Condiciones de bloqueo
Coste omitido, margen insuficiente, cambio de alcance sin aprobación, horas empleado confundidas con ahorro.

## Drivers del precio
Todos los drivers directos, overhead, captación y fiscalidad desglosados.

## Referencia funcional
`calculateUnitEconomics`. No es servicio en producción; esta referencia no firma gates ni otorga acceso real.

## Pendiente para operar con clientes
Costos observados por cliente/job, timesheet, renovación, sensibilidad, comparativas de precios y signoff financiero.

## Nodos y criterios de aceptación (fuente: Operating Atlas original)

| Identificador | Componente | Entrada | Salida | Criterio de aceptación |
|---|---|---|---|---|
| `economics.sku` | Paquetes / SKU | Tipo de servicio | Catálogo precios | Alcance y exclusiones claras |
| `economics.volume` | Participantes y proyectos | Tamaño cohorte | Escalas de precio | Definir topes |
| `economics.complexity` | Complejidad de entrega | Repo,video,código,datasets | Unidad coste por modalidad | Tiempo medido |
| `economics.human_hours` | Horas de personas | Analistas,jueces,PM,legal | Coste laboral por edición | Sin horas gratuitas implícitas |
| `economics.compute` | Coste nube/LLM | Tokens,CPU,almacenamiento | Costes variables | Etiquetas tenant/job |
| `economics.jury_cost` | Jurado externo | Perfiles y duración | Coste de evaluación | Calibración presupuestada |
| `economics.prize_cost` | Premios e impuestos | Bases y localización | Incentivo financiado | Separado o incluido en precio |
| `economics.risk_premium` | Riesgo y seguridad | Sensibilidad/sector | Coste adicional justificado | Sujeto a capacidad/aceptación |
| `economics.change_orders` | Cambios alcance | Solicitudes extra | Presupuesto adicional | Aprobación anterior a ejecución |
| `economics.margin` | Margen contribución | Precio y COGS | Rentabilidad por cliente | Estructura fija aparte |
| `economics.followup` | Renovación / anualidad | Resultados y demanda | Nuevo ciclo o suscripción | Sin atar cliente a datos |
| `economics.pricing_gate` | Gate cotización | P&L y legal | Oferta autorizada | G0, margen mínimo aprobado |
