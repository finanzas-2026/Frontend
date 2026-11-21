# 0001 Servidor de demo y entornos de API

**Estado** Aceptada para la demo, 21 de noviembre de 2026.

## Contexto

La migración a JSON Server conservó las colecciones de IAM, Catálogo y Crédito. Las pantallas de ventas, simulación, cobranza y analítica dependen de operaciones de negocio que un CRUD por colección no implementa.

## Decisión

Ejecutar JSON Server en loopback, puerto 8080, con operaciones de negocio bajo `/api/v1` y una copia en memoria de la semilla. Reutilizar el motor financiero del dominio de Finanzas. Angular usa un entorno de desarrollo explícito. El build de producción sustituye ese entorno y usa una API del mismo origen en `/api/v1`.

## Alternativas

MSW permite simular respuestas en el navegador, pero no ejercita la integración con el servidor acordado. Un CRUD por colección permite consultar fichas, pero no puede confirmar coordinadamente una venta o un cobro. El backend real queda como destino del contrato cuando esté disponible.

## Consecuencias

La demo se reinicia desde la semilla. El encabezado de identidad representa una sesión sintética y se habilita solo en desarrollo. La autoridad sobre credenciales, permisos y persistencia en producción corresponde al backend. El chequeo global de duplicación toma el 4,23 % de la versión base como límite de regresión, y los cuatro módulos intervenidos mantienen el límite del 3 %.

## Referencias

- [Contrato y ejecución de la demo](../api-contract.md)
- [Configuración de compilación](../../angular.json)
