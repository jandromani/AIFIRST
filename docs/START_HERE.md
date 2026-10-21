# Empieza aquí

**No hay despliegues, preview, Vercel, dependencias de terceros ni datos reales.** El producto se desarrolla localmente con Node.js 20+.

## Recorrido en orden
1. `npm test` — pruebas de contratos, consistencia del catálogo y gates.
2. `npm run check:catalog` — integridad del grafo de los dominios 01–05.
3. `node bin/aifirst.mjs validate ClientBrief examples/synthetic/ClientBrief.json`
4. `node bin/aifirst.mjs gates examples/synthetic` — G0, G1 y G2 simulados, nunca aprobación real.
5. `node bin/aifirst.mjs quote examples/synthetic/PricingQuote.json`

Los `examples/synthetic` son simulaciones. Los metadatos de aprobación no constituyen evidencia de autoridad real.

## Convención de entradas
Un contrato = un documento JSON. Nombre de archivo `<Contract>.json`. En un piloto real se alojarán en almacenamiento privado segregado por cliente; **nunca** en GitHub público. Los cuestionarios convierten respuestas a esos documentos.

## Estado
Diseño ejecutable de los cinco dominios. Aún no hay API, autenticación, almacenamiento privado, LLM, ejecución de proyectos, jurado en producción ni aprobación legal. No se promete una EIPD completada ni cumplimiento legal acreditado.
