# Operating Atlas · Contrato único 01–20

**20 dominios · 230 componentes · 171 relaciones** en `catalog/operating-model.json`. Se han incorporado los 95 nodos originales 13–20 con sus criterios de aceptación. Todos los nodos están documentados, no necesariamente implementados.

## Abrir offline
1. `npm run build:atlas` regenera `web/atlas.html` desde el catálogo.
2. Abrir `web/atlas.html` con el navegador (sin servidor, sin Vercel, sin CDN).
3. Seleccionar dominio, buscar piezas, navegar conexiones y abrir paneles de aceptación.

El grafo es un inventario de requisitos y dependencias; **no puede demostrar que 230 capacidades estén funcionando**. Consultar `catalog/implementation-status.json` para los estados. `docs/modules/` conserva el detalle de cada dominio.

## G0–G7
Los ocho gates están definidos en `catalog/gates.json`. Los JSON y CLI muestran evaluaciones sintácticas y preparación de paquetes; G3–G7 no pueden autorizarse con valores ficticios. Las firmas y los permisos requieren sistemas y personas verificadas.

## Próximo incremento
Relaciones contractuales tipadas (REQUIRES, PRODUCES, GOVERNED_BY, EVIDENCED_BY, APPROVED_BY, COSTED_BY) y reconciliación automática con evidencias operativas. No inferir una relación porque esté dibujada.
