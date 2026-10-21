# AIFIRST · AI First Discovery Engine

> **Hackathon in → Evidence-first organizational roadmap out.**

**Estado:** Blueprint estandarizado 01–12 y prototipo offline parcial 06–12. **No es software de producción.** Código, metodologia y ejemplos exclusivamente ficticios. **No hay Vercel, despliegues, previews ni integraciones remotas.**

## Explorar
- [Operating Atlas offline](web/atlas.html) · **12 dominios, 135 componentes y 68 relaciones** con búsqueda, panel de detalle, filtros, zoom y navegación.
- [Catálogo canónico](catalog/operating-model.json) y [flujos 06–12](catalog/phase2-workflows.json).
- [Estados de implementación honestos](catalog/implementation-status.json) y [aceptación operativa 06–12](docs/06-12_OPERATING_ACCEPTANCE.md).
- [23 contratos JSON Schema](contracts/index.json), separados en [archivos individuales](contracts/).
- [Prototipo de fase 2](src/phase2.mjs): plan de comunicaciones, equipo, hashing de entregas locales, cuarentena, planning de jobs, criterios con evidencia, jurado como preflight, capacidades contextualizadas y agregados protegidos.
- [Ejemplos puramente sintéticos 01–05](examples/synthetic/) y [06–12](examples/phase2/).
- [13 issues del backlog](https://github.com/jandromani/AIFIRST/issues) y [guía de inicio](docs/START_HERE.md).

## Ejecutar localmente (Node 20+)
```bash
npm test
npm run check:catalog
npm run check:synthetic
npm run check:phase2
npm run inspect:phase2
npm run build:atlas
```
Abrir `web/atlas.html` desde el sistema de archivos. No requiere cuentas, dependencias externas, acceso de red ni claves.

## Arquitectura por gates
01–05: G0 comercial, G1 contrato, G2 reto aprobado.
06–09: comunicación, registro, evidencias, intake/quarantine, G3 revisión de seguridad real.
10–12: jobs limitados, evaluación por evidencia, jurado G4, observaciones de capacidades y agregados privados.

**G3 y G4 nunca se aprueban realmente en esta versión.** Los archivos sintéticos no sustituyen firma humana, verificación legal, scanners AV/PII/secrets, workers aislados ni control de identidad. El runner offline no envía notificaciones, no ejecuta proyectos externos ni consulta LLM.

## Seguridad y ética operacional
- **Ranking de soluciones comparable**, no ranking automático de trabajadores.
- Evidencias individuales solo contextualizadas, finalidad adecuada, revisión humana y audiencia restringida.
- Grupos con menos de k personas tienen sus recuentos y denominadores suprimidos.
- Un `approved` escrito a mano en JSON **no equivale a firma verificable**.
- Nunca subir datos reales de clientes, empleados, identidad nominativa, secretos ni anexos confidenciales a este GitHub público.
- Cambios en contratos y rúbricas se versionan; las evaluaciones sin fuentes no son válidas.

## Dónde seguimos
Backlog de implementación productiva por módulo en [issues 7–13](https://github.com/jandromani/AIFIRST/issues). Módulos 13–20 se incorporarán al catálogo conforme a [issue 6](https://github.com/jandromani/AIFIRST/issues/6). La cobertura documental es distinta de estar operativos en una empresa real.
