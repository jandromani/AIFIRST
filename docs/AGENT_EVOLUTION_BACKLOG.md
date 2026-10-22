# Agent Evolution OS · separación entre MVP probado y obligaciones externas

## Implementado en runtime

- Estado SQLite y API tenant-scoped, protocolo para agentes externos, tareas de 9 competencias conectadas al Atlas, marketplace 4 días, espejos firmados, canales GOD/GOVERNANCE, propuestas y papeletas constitucionales, arenas independientes inyectadas, promoción canary local, rollback, liga semanal, frontend y demo CLI.

## Gate de piloto autorizado (NO READY)

1. Evals de tareas reales con validadores independientes y métricas trazables, anti-Goodhart, costes por trabajo, WORM, auditorías de modelo; pasar de fixtures a tests homologados.
2. KMS/PKI e identidad de servicio, política de herramienta sandbox, proveedor OpenRouter homologado o modelos alternativos autorizados; denegar ejecución no confiable.
3. Operativa segura multiproyecto: PostgreSQL o HA real, backups externos, reintentos distribuidos, restore DR, métricas y guardias por tenant.
4. Separación de poderes externa: aprobadores humanos autenticados, firma contractualmente aceptada y procedimientos de emergencia/rollback.
5. Conectores end-to-end reales en sistemas de agentes de terceros y aceptación de clientes. Documentar límites y jurisdicción.
6. UX visual y de accesibilidad, revisión legal de claims y métricas con clientes reales.

**No cerrar los issues #23,#27,#28,#29,#31,#32 ni el master #6 por esta entrega:** su definición contempla servicios externos y validaciones que el entorno local no proporciona.
