# Vertical Slice 0.2 · Primer recorrido verificable de un engagement

Esta iteración conecta **07 → 08/09 → 11/12 → 13 → 14 → 15 → 16 → 19 → 20** en un único comando offline. Se mantiene el resto de módulos/gates del Atlas como contrato o diseño, no como actividad ejecutada. La edición es obligatoriamente **sintética**.

```bash
npm run simulate:engagement
npm test
```

## Contrato de entrada
- `examples/phase2/`: participantes pseudonimizados, equipo, manifest con archivos físicos, challenge, rubric, claims ficticios y jurado ficticio.
- `examples/vertical/PriceModel.json`: precio y costes del mismo tenant/engagement.
- Catálogos canónicos de gates, outputs y 230 nodos.

## Pipeline y sus límites
1. **07** valida elegibilidad, retirada, roster y ámbito.
2. **08–09** comprueba hashes de ficheros y manifiesto. Los archivos *continúan en cuarentena*. No hace AV, escaneo PII ni ejecuta software.
3. **11–12** compara evidencias declaradas de la muestra ficticia con la rúbrica; la nota es **provisional, no apta para ranking**, y la observación privada de capacidad **nunca se exporta al resumen**. No valida la identidad del jurado.
4. **13** forma un grafo de **propuestas**, no de hechos certificados, usando solo IDs y relaciones con fuentes. La vista CEO omite identidades.
5. **14** propone una alternativa de piloto sin asignar empleados ni aprobar el comité G5.
6. **15** crea manifiesto y dos borradores Markdown; ni G6 ni destinatarios reales están firmados.
7. **16** genera tres candidatos D30/D60/D90; no activa iniciativas ni mide ahorros.
8. **19** calcula una estimación de costes directos y margen con supuestos.
9. **20** devuelve cobertura del inventario, sin afirmar verificación de producción.

**Todos los gates G0–G7 permanecen en estado UNVERIFIED.** La cadena offline no trata datos de empresas reales, no llama LLMs ni servicios externos y no publica informes.

## Siguientes requisitos para producción
- Identidad y políticas de acceso reales, almacenamiento cifrado por cliente y escaneos de seguridad verificables.
- Workers/sandbox, jurado independiente con firmas, review de seguridad y permisos G3/G4.
- Comité G5, aprobación CEO G6, handoff G7, medición de KPI y borrado/cierre formal.
- Pruebas Node + browser en checkout local y ensayo autorizado con datos de prueba controlados.

**No confundir la bandera `synthetic` con un mecanismo de protección para datos reales.** El CLI solo usa rutas fijas de fixtures públicos y no permite apuntar a carpetas de clientes.
