# 06 · Canales y comunicaciones

**Responsable:** Community / Customer Success. **Estado:** diseño completo + prototipo offline parcial.

## Entradas
ChallengeBrief publicado, audiencias por rol, plantilla versionada, opt-out, aprobación de canal

## Salidas
DeliveryMessage, EventEnvelope, incidencias y estado de entrega

## Proceso externo / cliente / participantes
El cliente decide canales autorizados y aprueba idioma/horarios; participantes reciben una versión única del mensaje y soporte accesible.

## Proceso interno AIFIRST
Preparar plantilla, resolver audiencia sin exponer listado, validar propósito, generar idempotency key, encolar, gestionar rebotes y confirmaciones, conservar trazas mínimas.

## Máquina de estados
`draft → reviewed → queued → sent|suppressed|failed → archived`

## Contratos
- [DeliveryMessage](../../contracts/DeliveryMessage.schema.json)
- [EventEnvelope](../../contracts/EventEnvelope.schema.json)

## Seguridad y punto de no retorno
Canal sin autorización; mensaje con secreto; SMS sin aprobación; duplicados.

## Aceptación verificable
No notificar dos veces; sin exponer datos; acceso multilingüe; evidencia de entrega desde proveedor.

## Cost drivers
Nº mensajes, idiomas, soporte/tickets, SMS, reuniones

## Implementado como prototipo local
- `comms.notifications`

## Backlog imprescindible de producción
- [ ] Integraciones email/Teams/Slack/Calendar
- [ ] webhooks firmados y recibos
- [ ] consentimientos y preferencias privadas
- [ ] portal WCAG verificado

**Importante:** no se ha probado con datos reales ni se han concedido permisos externos. El prototipo jamás debe presentarse como firma humana, scanner de malware, SSO o ejecución de agentes.
