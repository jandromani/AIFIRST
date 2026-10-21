# QA de referencia · 21 octubre 2026

## Evidencia disponible
- Primera iteración (01–05): **21/21** comprobaciones sobre el motor `src/core.mjs` en V8 con filesystem simulado, previo a extensión de contratos.
- Segunda iteración (06–12): **16/16** comprobaciones de la lógica publicada con V8 y archivos/hashes simulados, sobre 12 dominios y 135 nodos; casos de duplicados, retirada, tenant y datos no verificados.
- Fuentes subidas a GitHub: **23 contratos JSON Schema**, **135 nodos**, **68 relaciones**, **5 puertas G0–G4 definidas**, **11 outputs finales diseñados**.
- Caso sintético: evaluación provisional de una solución puntuable con 3,65/5 según claims ficticios. No hay publicación ni ranking válido: G3/G4 siguen pendientes de verificación externa.
- Atlas generado desde `catalog/operating-model.json`. Sin dependencias NPM en `package.json`, sin frontend remoto.

## Verificaciones de ingeniería todavía pendientes
- **No se ha ejecutado `npm test` en un checkout real con Node 20+, ni browser e2e/visual**. V8 con stubs de ESM/fs/crypto sirve para detectar lógica, pero no prueba integración Node real ni seguridad de ficheros maliciosos.
- Repetir batería tras cambios de privacidad: pequeños agregados no pueden filtrar recuentos ni denominadores; agregar por tenants distintos debe lanzar error.
- No hay pruebas auténticas AV, secreto, PII, sandbox, autenticación, colas, jurado o firmas. El motor sigue bloqueando cualquier aprobación operativa.
- Revisar por jurídico, DPO y RRHH antes de un piloto con personas reales.

## Qué significa «cerrado»
- **Estándares y contrato de módulos 06–12:** inventariados y documentados.
- **Referencia offline:** implementada parcialmente, con tests automatizables.
- **Operación empresarial verificada:** NO. Las dependencias y criterios de aceptación están en issues 7–13. Ninguna certificación de cumplimiento se afirma.
