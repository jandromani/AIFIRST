# Verificación offline en un solo comando

```bash
npm run verify:local
```

Este runner usa exclusivamente Node.js y herramientas estándar del repositorio. Secuencialmente ejecuta:
1. `node --test`;
2. validación catálogo;
3. gates sintéticos G0–G2;
4. validación Fase 2;
5. validación Fase 3;
6. simulación integrada;
7. exportación a `artifacts/`;
8. regeneración del Atlas y cotejo exacto de HTML/catalog.

**Salida:** `artifacts/local-verification.json` con fecha, versión Node, estados, tiempos y SHA-256 del log. El archivo está ignorado por Git. Si una fase falla, devuelve código distinto de cero y salta las siguientes.

No usa Vercel, CI/CD, navegador ni servicios externos. **Un PASS de este comando no acredita seguridad real, calidad de modelos, autorización humana ni cumplimiento legal.**
