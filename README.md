# AIFIRST · AI First Discovery Engine

**Estado:** MVP en construcción · **Fuente de verdad:** este repositorio.

AIFIRST transforma un hackatón interno en evidencias de soluciones, un diagnóstico de capacidades **observadas**, escenarios de organización revisados por humanos y un roadmap ejecutable. El hackatón es un mecanismo de adquisición de evidencias, no el producto final.

## Principios
- **Evidence-first:** cada conclusión operativa está vinculada a una fuente.
- **Projects before people:** se pueden comparar soluciones; no hay ranking global automatizado de empleados ni decisiones laborales automáticas.
- **Privacy by design:** datos empresariales confidenciales y personales jamás se suben a este repositorio público.
- **Human gates:** las transiciones G0, G1 y G2 requieren aprobación humana verificable; un LLM no puede aprobarlas.
- **Reproducibility:** contratos y rúbricas versionados; inputs validados y resultados auditables.
- **Zero deployment:** documentación, CLI y tests locales; sin Vercel, previews, infraestructura externa ni consumo de modelos en esta fase.

## Orden de entrega
1. Fundación y contratos canónicos.
2. 01 Mercado y ventas → 02 Contrato y alcance → 03 Conocer la empresa → 04 Legal, personas y confianza → 05 Diseño del reto.
3. Más adelante: participación, entregas, evaluadores aislados, jurado, grafo, reporting y activación.

## Seguridad
No almacenar datos personales reales, listados de empleados, ficheros de clientes, tokens ni secretos en GitHub. Todo ejemplo debe ser ficticio. Este proyecto no sustituye revisión legal ni auditoría de seguridad.

## Desarrollo
Se incorporarán comandos sin dependencias de terceros sobre Node.js 20+, ejemplos sintéticos y tests nativos. Ver `docs/OPERATING_MODEL.md` y `docs/START_HERE.md`.
