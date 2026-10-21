# Operating Atlas · Navegación y verdad documental

Abrir `web/atlas.html` en el navegador; funciona con `file://`, sin servidores, sin cuentas, sin APIs y sin Vercel.

Se genera desde `catalog/operating-model.json` con `node bin/build-atlas.mjs`. **No editar manualmente el HTML generado:** cambiar primero el catálogo. Búsqueda, filtro por dominio, zoom, arrastre, relaciones y fichas están integrados.

Este Atlas es actualmente una **vista verificable de diseño para dominios 01–12** (54 componentes, 20 relaciones). No sustituye el Atlas empresarial inicial de 20 dominios / 230 nodos, que sigue como plano de referencia y debe migrarse a contratos de código gradualmente. No afirmar cobertura 100 % ni despliegue cuando solo hay diseño.

Las relaciones de este primer núcleo se modelan con vínculos INFORMS; más adelante se necesitarán tipos `REQUIRES`, `PRODUCES`, `GOVERNED_BY`, `EVIDENCED_BY`, `APPROVED_BY` y `COSTED_BY`.
