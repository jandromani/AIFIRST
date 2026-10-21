# 17 · Operación de nuestra empresa

**Propietario:** COO / Delivery Manager · **Fase:** 08 · OPERAR · **Estado:** contrato y referencia offline; producción pendiente.

## Propósito
Backoffice completo: proveedores, staffing, jurado, calidad, soporte y continuidad.

## Entrada y salida
- **Entrada:** Contratos y plan de entrega
- **Salida:** Servicio operado y auditable
- **Aceptación:** Entrada tipada, salida versionada, evidencia y aprobación según riesgo
- **Contratos:** EngagementConfig, EventEnvelope

## Proceso externo
Cliente cuenta con interlocutor, SLA, gestión de incidencias y notificaciones, facturas y aceptación de hitos; proveedores y jurado con compromisos claros.

## Proceso interno
Handoff CRM→SOW; RACI/capacidad; pool jueces y conflictos; contratos proveedores; soporte; incidentes; facturación; QA cuatro ojos y postmortem.

## Máquina de estados
`contracted → staffed → active → billing_review → closed`

## Condiciones de bloqueo
Horas sobreasignadas, incidente crítico sin resolver, juez recusado o factura no conciliada.

## Drivers del precio
Horas staff, jueces, proveedores, incidentes, soporte y estructura.

## Referencia funcional
`checkDeliveryOperations`. No es servicio en producción; esta referencia no firma gates ni otorga acceso real.

## Pendiente para operar con clientes
Sistema ticketing, facturación, reconciliación bancaria, control proveedores, evaluación NDA/COI y dashboards SLA.

## Nodos y criterios de aceptación (fuente: Operating Atlas original)

| Identificador | Componente | Entrada | Salida | Criterio de aceptación |
|---|---|---|---|---|
| `ops.crm_to_project` | Traspaso comercial | SOW y CRM | Proyecto operativo | Checklist de traspaso |
| `ops.staffing` | Equipo entrega | Carga y competencias internas | RACI staffing | No sobreasignar horas |
| `ops.judges_pool` | Red de jueces | Perfiles/conflictos | Comité disponible | Independencia comprobada |
| `ops.supplier` | Proveedores | Modelos,nube,consultores | Registro de terceros | Contratos y riesgo |
| `ops.templates` | Biblioteca plantillas | Inputs / informes | Versiones publicadas | Control cambios |
| `ops.qa_ops` | QA de entregables | Checklist completo | Dictamen de calidad | 2 ojos sobre salida ejecutiva |
| `ops.customer_service` | Soporte cliente | Tickets y SLA | Resoluciones y acciones | Tiempos medidos |
| `ops.incident` | Incidentes | Alertas/quejas | Registro y respuesta | Notificación según severidad |
| `ops.billing` | Gestión cobro | Facturas y condiciones | Cobros y facturación | Conciliación financiera |
| `ops.staff_training` | Formación interna | Nuevos procesos y leyes | Operadores habilitados | Evaluación de competencia |
| `ops.postmortem` | Retrospectiva edición | Métricas de operación | Mejoras proceso | Seguimiento acciones |
