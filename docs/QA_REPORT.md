# Verificación realizada · 21 octubre 2026

## Alcance verificado
- **21 comprobaciones completadas:** ejecución aislada del código real de `src/core.mjs`, leído de GitHub y ejecutado en V8 con sistema de archivos de solo lectura simulado. Resultado: **21/21**.
- Contratos `ClientBrief`, `SalesQualification`, `PricingQuote`, `EngagementConfig`, `CompanyContext`, `RiskRegister`, `ChallengeBrief` y `Rubric` validados; tres aprobaciones de ejemplo compatibles.
- G0, G1 y G2 correctos con ejemplos sintéticos. Fallos provocados: lead no cualificado, DPA pendiente, riesgo crítico abierto, rúbrica alterada, baseline inexistente, falta de metadatos del aprobador y propiedad extra innecesaria.
- Coste directo demostración: 9.920 €; precio mínimo para margen objetivo del 40 %: 16.533,34 €; oferta sintética: 18.900 €.
- Integridad del catálogo: 5 dominios, 54 componentes y 20 enlaces válidos.
- Atlas: JSON incorporado compatible, script compilable, no dependencias ni llamadas de red externas.

## Limitaciones NO resueltas
- **No se ejecutó el comando real `npm test` bajo Node en un checkout de GitHub.** Las verificaciones en V8 no prueban módulos ESM, fs real, CLI ni comportamiento de un navegador gráfico.
- No se verificaron firmas humanas, seguridad productiva, compatibilidad legal, calidad de informes ni interfaz mediante capturas del nuevo repositorio.
- La validez del diseño en una empresa real todavía no está probada.
- No existe infraestructura privada ni aislamiento multi-tenant desplegado.

## Próxima aceptación
Ejecutar localmente `npm test`, `npm run check:catalog`, `npm run check:synthetic`, `node bin/build-atlas.mjs`, abrir `web/atlas.html` en Chrome/Firefox y capturar resultados. Después tratar correcciones y cerrar el gate de la iteración 0.
