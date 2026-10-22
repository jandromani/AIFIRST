# Agent Evolution OS · QA audit / 2026-10-22

## Matriz de seguridad y capacidades

- [x] Todos los registros incluyen tenant y se consultan con contexto del usuario.
- [x] Acceso de espejo a `GOD` y `GOVERNANCE` excluye al admin común y al orquestador-modelo; requiere auditor/security humano.
- [x] Censo congelado para votación de creencias, papeletas Ed25519 individualmente verificadas, `NO` o ausencia bloquean; si cambia plantilla activa se invalida.
- [x] Gate humano separado de propuesta, promociones y rollback con evidencias locales.
- [x] Arenas con evaluador inyectado de confianza, misma prueba oculta para ambos candidatos, guardrails coste/latencia/seguridad y no exposición de suites al candidato.
- [x] Interfaz para el mercado cada 4 días, candidaturas y liga; se diferencian demos sintéticas de pruebas reales.
- [x] Integración de metadatos estricta, marcada **UNVERIFIED_EXTERNAL** y excluida de promociones.
- [x] El runtime de agente usa únicamente metadatos de prueba OpenRouter Free y no lee ni ejecuta documentos de clientes.
- [x] Landing posiciona dos productos y ofrece Evolution OS en la misma web del Atlas y del Command Center.
- [ ] Motor de evaluación real acreditado, corpus ciego representativo, evaluaciones intermodelo y revisión de sesgo/reward hacking.
- [ ] Claves y firmas gestionadas por HSM/KMS, identidad de agente vinculada a cuentas de servicio y revocación online.
- [ ] Capa WORM externa; el hash encadenado local no es prueba antifraude independiente.
- [ ] Aprobación jurídica de workflow y controles externos de privacidad antes de usar datos empresariales.
- [ ] Pruebas reales contra conectores LangGraph, CrewAI, n8n y agentes del cliente.
- [ ] Browser QA integral, accesibilidad certificada, load test y observabilidad distribuida.

### No confundir con el hackatón humano

La competición aquí es entre **versiones de software agéntico**, nunca entre personas. "Expulsión", "empleo" y "premio" son metáforas de elección y versionado. No trasladar estos mecanismos a evaluación laboral automática. La simulación puede mostrar una versión más puntuable pero no afirma mejora de negocio hasta un experimento real.
