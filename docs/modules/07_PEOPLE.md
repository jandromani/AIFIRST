# 07 · Participantes y equipos

**Responsable:** Operaciones / Responsable cliente. **Estado:** diseño completo + prototipo offline parcial.

## Entradas
Reglas G2, invitación, identidad autorizada, consentimiento o legitimación aplicable, elegibilidad, preferencias

## Salidas
ParticipantRegistration y TeamRoster pseudonimizados

## Proceso externo / cliente / participantes
Inscripción accesible, información de usos y derechos, elección de participación, composición de equipos y posibilidad de rectificación.

## Proceso interno AIFIRST
Verificar elegibilidad con cliente, registrar aceptación, crear alias en almacén privado, gestionar asignación y roles, verificar cambios/retirada, limitar visibilidad.

## Máquina de estados
`invited → informed → eligible → active|withdrawal_review → closed`

## Contratos
- [ParticipantRegistration](../../contracts/ParticipantRegistration.schema.json)
- [TeamRoster](../../contracts/TeamRoster.schema.json)

## Seguridad y punto de no retorno
Registro sin aviso; alias duplicado; equipo incoherente; uso de dato sensible en scoring.

## Aceptación verificable
Roster sin duplicados y sin identidad nominativa en capas de evaluación; cambios trazados.

## Cost drivers
Inscripciones, soporte, SSO, revisiones jurídicas y accesibilidad

## Implementado como prototipo local
- `people.team`

## Backlog imprescindible de producción
- [ ] SSO real y alias↔identidad segregada
- [ ] gestión de derechos y bajas real
- [ ] gestión de consentimientos/preferencias por ley
- [ ] validación de condiciones laborales

**Importante:** no se ha probado con datos reales ni se han concedido permisos externos. El prototipo jamás debe presentarse como firma humana, scanner de malware, SSO o ejecución de agentes.
