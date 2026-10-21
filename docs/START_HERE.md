# Inicio AIFIRST · Módulos 01–12

**Cero Vercel, cero despliegues, cero llamadas a servicios externos.** Node 20+ y lectura/escritura local de ejemplos sintéticos.

## 1. Comprender
- Atlas: `web/atlas.html` (12 dominios, 135 componentes).
- Definición 06–12: `docs/06-12_OPERATING_ACCEPTANCE.md`.
- Inputs/outputs/gates: `catalog/phase2-workflows.json`, `catalog/gates.json` y `contracts/index.json`.
- Implementación vs. pendiente: `catalog/implementation-status.json`.

## 2. Ejecutar el prototipo
```bash
npm test
npm run check:catalog
npm run check:synthetic
npm run inspect:phase2
npm run check:phase2
npm run build:atlas
```
Los ejemplos no representan validación jurídica real ni firma de revisor. `inspect:phase2` comprueba bytes y hashes pero **mantiene todos los artefactos en cuarentena**, porque no existe antivirus ni aprobación G3 operativa. `check:phase2` produce una propuesta documental **pendiente de jurado G4**.

## 3. Reglas para desarrollar
- Introducir cambios primero en contratos y catálogo, después en motor y tests, finalmente regenerar Atlas.
- Añadir tests negativos para invalidación de estado, tenant equivocado, rutas peligrosas, precios, privacidad, rúbricas y signoffs.
- Nada de credenciales o documentos reales en GitHub. Almacenamiento e identidad deberán estar aislados cuando existan.
- No ejecutar repositorios participantes hasta contar con scanner, sandbox, políticas de red y autorización humana auténtica.

## Estado real
Los módulos 01–12 están especificados; existe prototipo offline parcial, no producto completo. Los módulos 13–20 siguen pendiente de migrar desde el blueprint.
