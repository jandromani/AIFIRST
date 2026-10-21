# Gap register · Auditoría de fases A–E

| Fase | Entregado como código ejecutable y probado | Depende de proveedor/cliente (NO resuelto) |
|---|---|---|
| A | 7 pruebas Node sobre SQLite, API real local; consola renderizada | Ejecutar tests completos previos y seguridad/browsers con checkout |
| B | Tenant, bearer token por rol, intake, hash SHA256, cuarentena, scanner ClamAV opcional | SSO, AV/PII/secretos homologados, cifrado, red corporativa, DPIA y G3 real |
| C | Adapter HTTPS modelo configurable, topes por llamada estimados, traza SQLite, jurado independiente local | Credenciales/modelo autorizados, gateway real, presupuesto facturado, sandbox, colas durables, G4 real |
| D | 11 EX originales con audiencia/formatos, JSON verificable, 3 escenarios, grafo simple | Render PDF/PPTX/ZIP, ACL por dato, gráfos temporales, informes finales firmados |
| E | Leads, contratos pendientes, facturas borrador, registro manual banco, premios/jurados pendientes | ERP fiscal, banco/TPV, pagos reales, anticipo, invoice numbering legal, conciliación externa |

**Gates:** solo revisión local G0/G2/G3/G4; G1/G5/G6/G7 bloqueados explícitamente. No hay autorización externa para clientes reales.
