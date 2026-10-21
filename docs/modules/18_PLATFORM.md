# 18 · Plataforma técnica

**Propietario:** CTO / Security Engineering · **Fase:** 08 · OPERAR · **Estado:** contrato y referencia offline; producción pendiente.

## Propósito
Infraestructura multiempresa: seguridad, aislamiento, resiliencia y observabilidad.

## Entrada y salida
- **Entrada:** Catálogo de servicios
- **Salida:** Runtime confiable y exportable
- **Aceptación:** Entrada tipada, salida versionada, evidencia y aprobación según riesgo
- **Contratos:** JobSpec, EventEnvelope, RiskRecord

## Proceso externo
El cliente negocia ubicación de datos, IAM/SSO, acceso, export y retención; recibe documentación de seguridad y resultados de restauración.

## Proceso interno
Definir tenant, RBAC, storage, metadatos, grafo, cola, gateway, secretos, backups, CI/CD, monitoreo y jobs de eliminación; revisar todos los accesos.

## Máquina de estados
`designed → tested → externally_attested → operational`

## Condiciones de bloqueo
Acceso cross-tenant, token ausente, backup no probado, política sin revisión, borrado durante legal hold.

## Drivers del precio
Cloud, base, storage, claves, auditoría, seguridad, disaster recovery.

## Referencia funcional
`authorizeTenantAccess (deny only), retentionDryRun`. No es servicio en producción; esta referencia no firma gates ni otorga acceso real.

## Pendiente para operar con clientes
SSO, persistencia, auditoría IAM, infraestructura, DR, aislamiento real, cifrado y secret manager.

## Nodos y criterios de aceptación (fuente: Operating Atlas original)

| Identificador | Componente | Entrada | Salida | Criterio de aceptación |
|---|---|---|---|---|
| `platform.tenancy` | Aislamiento tenant | Cliente/engagement | Espacios independientes | Pruebas aislamiento |
| `platform.identity` | IAM/SSO | Usuarios y roles | Autenticación federada | MFA y sesiones cortas |
| `platform.object_storage` | Almacenamiento objetos | Paquetes de proyectos | Bucket cifrado | Acceso restringido |
| `platform.metadata_db` | Base metadatos | Manifiestos y estados | SQL con RLS | Migraciones controladas |
| `platform.graphdb` | Almacén de grafo | GraphNode/GraphEdge | Relaciones consultables | ACL a nivel datos |
| `platform.queue` | Cola de tareas | JobSpec y eventos | Workers y DLQ | Idempotencia |
| `platform.llm_gateway` | Puerta LLM | Modelos/proveedores | Control de inferencia | Sin entrenamiento externo salvo pacto |
| `platform.observability` | Observabilidad | Trazas/eventos | Métricas y alarmas | Redactar datos sensibles |
| `platform.keys` | Secret manager | Credenciales e integraciones | Rotación y cifrado | Nada sensible en prompts/logs |
| `platform.backups` | Backup/restauración | Datos operativos | Copias verificadas | Restauración ensayada |
| `platform.cicd` | CI/CD y SAST | Código y configs | Releases firmados | Pruebas por versión |
| `platform.retention_worker` | Jobs de borrado | Políticas y solicitudes | Borrado verificable | Retención por tipo |
| `platform.resilience` | Continuidad y DR | SLO/amenazas | Procedimiento BCP | RTO/RPO acordados |
