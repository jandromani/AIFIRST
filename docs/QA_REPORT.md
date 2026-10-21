# QA de referencia · 21 octubre 2026

## Confirmado por ejecución aislada de código publicado
- **01–05:** 21/21 comprobaciones de lógica núcleo realizadas en la iteración anterior, con filesystem simulado.
- **06–12:** 16/16 pruebas ejecutadas contra `src/phase2.mjs` con filesystem y SHA256 conocidos simulados (V8). Incluyen duplicados, retiradas, cambios de contenido, evidencia ausente, no publicación y supresión de pequeñas muestras.
- **QA estructural posterior:** 11/11 comprobaciones de catálogo, Atlas, contratos, tests y bloqueo de ejecución.
- **QA específica posterior de privacidad:** cinco invariantes positivos: sin recuentos en celdas menores de k, prohibición de mezclar tenants, esquema de aggregate compatible y sin ranking definitivo offline.
- Se han añadido tests Node permanentes para asegurar sincronía exacta Atlas ↔ catálogo y consistencia de los siete workflows.

## Inventario verificado
12 dominios, **135 componentes**, **68 relaciones**, **23 contratos JSON Schema**, cinco puertas G0–G4 y **11 outputs comerciales diseñados**. La edición ficticia valida hashes de dos artefactos y produce una nota provisional de solución de **3,65/5**; ni G3 ni G4 se dan por aprobados de verdad.

## Limitaciones
**No se han ejecutado todavía `npm test` ni tests visuales completos en un checkout de Node real.** Las verificaciones V8 aisladas no validan el comportamiento de I/O en Node, un navegador gráfico, AV, PII/secret scanners, sandbox, firmas, permisos, seguridad de un cliente real ni exactitud de modelos. Todos esos bloques se han dejado como issues de producción.

## Estado de entrega
Documentación y especificación modular 06–12: completas como blueprint. Implementación local: parcial, útil para pruebas sintéticas. Producto empresarial seguro y productivo: **no**; pendientes issues #1, #2 y #7–13. No se realizaron despliegues.
