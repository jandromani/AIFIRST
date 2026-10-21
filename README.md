# AIFIRST · AI First Discovery Engine

> **Hackathon in → Evidence-first organizational roadmap out.**

**Estado:** MVP offline de dominios 01–05. **Repositorio público:** solo código, metodología y datos sintéticos. No desplegado, no conectado a Vercel.

## Qué hay disponible
- [Atlas autónomo e interactivo](web/atlas.html): 5 dominios, 54 componentes, relaciones, filtros, búsqueda, navegación y detalle.
- [Catálogo operativo fuente de verdad](catalog/operating-model.json) y [canales de intake](catalog/channels.json).
- [Contratos JSON Schema](contracts/) versionados, [índice de contratos](contracts/index.json) y validaciones offline.
- [Modelo de negocio y gates](docs/OPERATING_MODEL.md), [preguntas intake](docs/INTAKE_PLAYBOOK.md), [backlog](docs/EXECUTION_BACKLOG.md).
- [Ejemplos 100 % ficticios](examples/synthetic/) con G0, G1 y G2, [tests](test/contracts.test.mjs) y motor de precios.

## En menos de un minuto (Node 20+)
```bash
npm test
npm run check:catalog
npm run check:synthetic
node bin/aifirst.mjs validate ClientBrief examples/synthetic/ClientBrief.json
node bin/aifirst.mjs quote examples/synthetic/PricingQuote.json
node bin/build-atlas.mjs
```
Luego abrir `web/atlas.html` localmente. **Ninguna instrucción despliega nada ni requiere API keys.**

## Fases y puertas
```text
01 Ventas / G0
→ 02 SOW, DPA, IP, premios / G1
→ 03 Contexto de empresa
→ 04 Riesgos y derechos / revisión humana
→ 05 Diseño del reto, rúbrica, jurado / G2
→ [siguientes iteraciones: entregas, evaluación, grafo, roadmap]
```

## Reglas innegociables
- Primero se evalúan **soluciones**, no se construye un ranking automático de empleados. Cualquier observación individual debe ser contextualizada, legítima, proporcional y revisable; nunca acciones laborales automáticas.
- Los controles G0–G2 **solo comprueban metadatos, contratos y coherencia**; no autentican firmas ni sustituyen aprobación legal.
- Nunca cargar información personal/confidencial en este repositorio público. No ejecutar proyectos recibidos sin sandbox seguro.
- Hipótesis de precios, escenarios, aprobaciones y ejemplos no son datos reales ni resultados acreditados.

[Guía inicial](docs/START_HERE.md) · [Revisión contractual](docs/REVIEW_CHECKLISTS.md) · [Atlas](docs/ATLAS.md)

## Qué falta
En este momento no existen backend, login, almacenamiento privado, motores LLM, jurado productivo, evaluación de participantes, monitorización de uso ni despliegues. Ver el [backlog de ejecución](docs/EXECUTION_BACKLOG.md).
