# Backlog maestro de AIFIRST

Estado: **todos los 20 módulos están documentados**, el prototipo offline cubre partes funcionales y **ninguno está autorizado para producción real**. Los issues no deben cerrarse por el mero hecho de que exista código o documentación.

## Cierre de diseño logrado
- [x] 01–05: captación, contrato, contexto, confianza, reto.
- [x] 06–12: comunicaciones, participantes, entregas, ingesta, orquestación, evaluación de soluciones, capacidades.
- [x] 13–20: grafo, escenarios, outputs, activación, operaciones, plataforma, economics, assurance.
- [x] 230 nodos del blueprint original migrados con ID idéntico, criterio de aceptación, dueño y contrato.
- [x] G0–G7 definidos, 11 productos de salida, 41 contratos JSON Schema, three-pricing-SKUs hipótesis.
- [x] Atlas HTML autónomo generado; ausencia de Vercel y de remotos.
- [x] Fichas de 20 dominios y catálogo de workflows 06–20.

## P0 — Cierre real del producto
- [ ] Ejecución Node 20+/22 real de suites; registro de resultados y navegador offline. [#1](https://github.com/jandromani/AIFIRST/issues/1)
- [ ] Firma, identidad, alcance y conformidad jurídico-laboral; datos reales solo en entorno protegido. [#2](https://github.com/jandromani/AIFIRST/issues/2)
- [ ] Dominio 06 [#7](https://github.com/jandromani/AIFIRST/issues/7), 07 [#8](https://github.com/jandromani/AIFIRST/issues/8), 08 [#9](https://github.com/jandromani/AIFIRST/issues/9), 09 [#10](https://github.com/jandromani/AIFIRST/issues/10), 10 [#11](https://github.com/jandromani/AIFIRST/issues/11), 11 [#12](https://github.com/jandromani/AIFIRST/issues/12), 12 [#13](https://github.com/jandromani/AIFIRST/issues/13).
- [ ] Dominio 13 [#14](https://github.com/jandromani/AIFIRST/issues/14), 14 [#15](https://github.com/jandromani/AIFIRST/issues/15), 15 [#16](https://github.com/jandromani/AIFIRST/issues/16), 16 [#17](https://github.com/jandromani/AIFIRST/issues/17), 17 [#18](https://github.com/jandromani/AIFIRST/issues/18), 18 [#19](https://github.com/jandromani/AIFIRST/issues/19), 19 [#20](https://github.com/jandromani/AIFIRST/issues/20), 20 [#21](https://github.com/jandromani/AIFIRST/issues/21).

## P1 — Entradas comerciales 01–05
- [ ] ICP, captación y pricing inicial documentados con primeros clientes. [#3](https://github.com/jandromani/AIFIRST/issues/3)
- [ ] Intake protegido CompanyContext/CSV-XLSX y fuente por campo. [#4](https://github.com/jandromani/AIFIRST/issues/4)
- [ ] Rúbrica y jurado independientes con freeze y verificación. [#5](https://github.com/jandromani/AIFIRST/issues/5)

## Transversal
- [ ] Backlog global de trazabilidad y ocho módulos, ya migrados como diseño. [#6](https://github.com/jandromani/AIFIRST/issues/6)
- [ ] Pruebas de escenario con cliente piloto, legal y seguridad, y aceptación humana de outputs.
- [ ] Precio basado en costes reales y resultados medidos; refinar SKU después de pilotos.
- [ ] Entorno multi-tenant de producción y DR antes de datos reales.
- [ ] Mecanismo de portabilidad y borrado conforme SOW y DPA.

## Exclusiones
Sin deploy, preview, Vercel, datos reales, decisiones laborales automáticas, evaluaciones de personas por ranking, informes CEO no revisados ni promesas de ROI verificadas.


## P0 · Recorrido ejecutable (última iteración)

- [x] Orquestador offline de una edición sintética: intake → cuarentena → valoración provisional de solución → grafo de propuestas → escenarios → informe → roadmap → economics → assurance.
- [x] Generador local de paquete ejecutivo HTML/MD/CSV/JSON y manifiesto SHA256 con rechazo de sobrescritura alterada.
- [x] Verificación local de un solo comando, sin infraestructura externa.
- [ ] Ejecutar las pruebas completas Node y adjuntar `artifacts/local-verification.json` (issue [#22](https://github.com/jandromani/AIFIRST/issues/22)).
- [ ] Validación visual del HTML y experiencia de revisión por dirección, con fuentes, contraste y accesibilidad.
- [ ] Controles G3/G4 auténticos, datos autorizados y piloto bajo contrato (issue [#23](https://github.com/jandromani/AIFIRST/issues/23)).
- [ ] Atomicidad de exportación, firma verificable de manifest y persistencia duradera en almacenamiento seguro.

## Entrega local A–E · Un solo commit

- [x] Motor local Node 22 + SQLite, roles tokenizados e aislamiento tenant con pruebas reales.
- [x] Intake API HTTP loopback, formulario local, upload binario, SHA-256, cuarentena y ClamAV opcional.
- [x] Modelo HTTPS explícito, costes estimados por job y revisión humana local sin decisiones laborales.
- [x] Catálogo EX01–EX11 reconciliado con el HTML original y manifiestos tipados.
- [x] CRM básico, contratos pendientes, registro de facturas, conciliación manual declarada y premios no ejecutados.
- [ ] Ejecutar todas las suites históricas `npm run verify:local` en un checkout de GitHub (issue #22).
- [ ] Probar SSO/AV/PII/secrets + firmas verificadas y sandbox productivo (issues #2, #10, #19, #23, #26).
- [ ] Integrar pasarela bancaria/ERP, pagos reales, premios, fiscalidad y conciliación auténtica (issue #25).
- [ ] Renderizar y entregar PDF/PPTX/ZIP cifrados EX01–EX11, firmas G6 y G7 (issue #24).
- [ ] Pentest, backups, retención y autorizaciones antes de una edición con personas reales.

El 100 % de cobertura del Atlas no es 100 % de capacidades productivas. Ningún issue productivo se cierra por esta implementación local.
