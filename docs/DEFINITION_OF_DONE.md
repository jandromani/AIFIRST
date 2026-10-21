# Definition of Done · AIFIRST

Los módulos se trabajan por **cuatro estados verificables**; ninguno se da por terminado simplemente porque exista una ficha o un test sintético.

| Nivel | Evidencia mínima | Puede tratar datos reales | Puede cerrar issue de producción |
|---|---|---|---|
| DESIGN | Input, output, owner, contrato, restricciones, criterios | No | No |
| OFFLINE_TESTED | Código, caso sintético reproducible, tests positivos/negativos | No | No |
| PILOT_AUTHORIZED | SOW/DPA, identidad, seguridad, aislamiento, consentimientos/finalidad, gates externos, auditoría | Solo bajo autorización | Solo issues de piloto específicos |
| PRODUCTION_VERIFIED | Seguridad, tenant isolation, SLA, QA E2E, coste y KPI auditables, portabilidad/borrado | Sí, dentro del contrato | Sí tras aceptación humana |

## Invariantes que nunca se relajan
1. Claims corporativos o de capacidades personales requieren evidencias de origen, revisión y alcance. Ausencia de evidencia es UNKNOWN, no fracaso de empleado.
2. G3–G7 nunca pueden aprobarse mediante un JSON aportado por el mismo agente o cliente; requieren infraestructura e identidad verificables.
3. El jurado evalúa **soluciones**; las decisiones laborales no se automatizan.
4. Una muestra de voluntarios no representa sin más a toda la organización.
5. Nunca mezclar datos de tenants. Una vista CEO no recibe perfiles privados de empleados.
6. Diferenciar costes hipotéticos, costes auditados, ROI estimado y ROI observado.
7. Borrado, exportación y retención no se confirman sin evidencia externa.
8. El código público y los informes sintéticos nunca incluyen clientes, participantes, secretos o datos confidenciales.

## Comprobaciones actuales
La [cadena offline](VERTICAL_SLICE.md) emite una prueba de concepto con todas las puertas sin verificar, un informe de muestra y trazas. No sustituye el servicio productivo. El issue [#22](https://github.com/jandromani/AIFIRST/issues/22) espera ejecución real Node, y [#23](https://github.com/jandromani/AIFIRST/issues/23) espera autorizaciones y infraestructura segura.

## Para dar por cerrado el 100 %
Todos los issues y gates tienen que referenciar evidencia: pruebas de integración, firma del responsable, acta de revisión de seguridad, documentación contractual y mediciones de pilotos. Solo entonces el Atlas podrá mostrar VERIFIED_PRODUCTION.
