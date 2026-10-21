# 02 · Contrato y alcance

**Owner:** Legal y dirección de proyecto. **Gate:** G1 obligatorio antes de recopilar información confidencial o convocar empleados.

### Paquete documental requerido (borradores hasta revisión jurídica)
- Propuesta aceptada con criterios de éxito y exclusiones.
- SOW: servicios, población cubierta, modalidades, hitos, cambios, criterios de aceptación, tarifas y cobro.
- Análisis de rol RGPD y DPA si aplica, subencargados, localización, transferencias, brechas y devolución.
- PI: titularidad de las soluciones, licencias de terceros, autorizaciones de demos y material preexistente.
- Bases: elegibilidad, criterios, premios, desempates, conflictos, reclamaciones, impuestos, remuneración y representación.
- SLA, soporte, resolución de incidencias y responsables.
- Portabilidad: exportaciones JSON/CSV/PDF, retención, revocación y certificado de borrado cuando corresponda.
- Responsabilidad y garantías, revisadas por asesoría jurídica independiente.

### Modelo operativo
Registrar `EngagementConfig` solo después de que el documento jurídico real esté identificado en el sistema privado. `sow_approved: true` o `dpa_status: approved` son **declaraciones sujetas a comprobación humana**, no una firma digital.

### Stop conditions
DPA necesario ausente, incompatibilidad de finalidad, permiso para reutilizar datos no concedido, PI ambigua, falta de sponsor, solicitud de decisión laboral exclusivamente automatizada. Cualquiera requiere resolver o desistir.
