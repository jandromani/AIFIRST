# AIFIRST · Quickstart

**Módulos 01–20, 230 nodos en catálogo.** No Vercel. Solo código sintético, CLI offline y dependencias estándar Node.

```bash
git clone https://github.com/jandromani/AIFIRST.git
cd AIFIRST
npm test
npm run check:catalog
npm run check:synthetic
npm run check:phase2
npm run check:phase3
npm run build:atlas
```

Abrir `web/atlas.html` en el sistema de archivos. Ejecutar `node bin/phase3.mjs demo examples/phase3` para diagnóstico sintético de los módulos 13–20. Este comando no consume APIs externas, no crea datos reales, no firma gates ni ejecuta código de terceros.

[Guía de 13–20](13-20_OPERATING_ACCEPTANCE.md), [13–20 workflows](../catalog/phase3-workflows.json), [source parity](MASTER_COVERAGE.md), [QA](QA_REPORT.md), [issues](https://github.com/jandromani/AIFIRST/issues).

No ejecutar código de participantes sin escáner, aislamiento y autorización. No usar notas de proyectos para decisiones laborales automáticas.
