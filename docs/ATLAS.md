# Operating Atlas · Contrato de navegación

Archivo HTML offline: [web/atlas.html](../web/atlas.html). Se genera desde `catalog/operating-model.json` mediante `npm run build:atlas`. **No editar directamente el HTML generado**.

Cobertura actual: **12 dominios, 135 componentes y 68 relaciones**. El anterior blueprint completo contiene 20 dominios/230 nodos pero **los ocho restantes no están migrados aquí**.

El catálogo contiene nodos en estado DESIGN: tener ficha de aceptación, dueño y dependencia no significa que haya servicio productivo. `catalog/implementation-status.json` especifica qué nodos tienen prototipo offline y los requisitos externos todavía pendientes.

Navegación: filtrar dominio para desplazar la vista, buscar por nombre/ID/entrada/salida, seleccionar nodos para ver ficha y saltar a dependencias; zoom y arrastre. Sin APIs externas.

Relaciones actuales: `INFORMS`. En la iteración de grafo 13 se añadirán `REQUIRES`, `PRODUCES`, `GOVERNED_BY`, `EVIDENCED_BY`, `APPROVED_BY` y `COSTED_BY` para trazabilidad total.
