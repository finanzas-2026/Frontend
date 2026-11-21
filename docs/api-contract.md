# Contrato de la API de demostración v1

Ejecuta `npm ci`. En terminales separadas, ejecuta `npm run api` y `npm start`. Abre `http://localhost:4200` con un usuario de tienda de la semilla sintética. Las operaciones se guardan en memoria y se reinician al detener el servidor. `npm run e2e` arranca ambos procesos en los mismos puertos, que deben estar disponibles para las pruebas.

Las rutas siguientes son relativas a `/api/v1`. Los importes de los flujos financieros usan texto decimal de dos posiciones y las tasas son fracciones. Por ejemplo, 18 % se escribe `"0.1800000"`. Los endpoints CRUD de IAM, Catálogo y Crédito conservan sus recursos existentes. La identidad de la demo proviene de la sesión del navegador. La autenticación de producción se integra con el backend real.

| Operación | Entrada y resultado |
| --- | --- |
| `POST /finance/simulate` | `initial_capital`, `rate_type`, `rate_value`, `rate_period_days`, `compounding_days` para nominal, `total_installments`, `grace_days` y `first_due_date` opcionales. Con `customer_id`, se usan el pacto y el ciclo de la ficha. Devuelve tasas normalizadas, cuotas, balances y totales. |
| `GET /sales/customers` | Proyección por tienda con `credit_limit`, `current_debt`, `max_credit_months` y la condición compensatoria. |
| `GET /catalog/products` | Productos activos de la tienda, con precio al contado, precio a crédito, stock y elegibilidad de pago mensual. |
| `GET /sales`, `GET /sales/:id`, `POST /sales` | Historial y registro de ventas. La confirmación recibe el cliente, tienda, modo, plazo, gracia y detalles. Para cuotas, incluye `tea` y `first_due_date` de la vista previa. El servidor vuelve a calcular precio, plazo, cupo y cronograma antes de modificar los datos. |
| `GET /settlements`, `GET /settlements/:id` | Liquidaciones de la tienda o del titular de la sesión. |
| `POST /settlements/cutoff` | Genera liquidaciones por cliente y período después de la fecha de corte. Devuelve `generatedCount`. Correr el cierre de nuevo deja las liquidaciones previas intactas. |
| `GET /settlements/:id/payoff-quote` | Capital, interés compensatorio, mora pactada y total a la fecha de demo. |
| `POST /settlements/:id/pay` | Recibe `amount`, `payment_method` y `reference_number` opcional. El importe debe coincidir con la cotización vigente. Repetir el mismo pago devuelve el mismo recibo. |
| `POST /__mock/advance-date` | Recibe `days` entre 1 y 360. El reloj inicial es 26/11/2026. Para una venta a cuotas de la semilla, avanza al 26/12/2026 o después y ejecuta el cierre. |
| `GET /analytics/kpis`, `GET /analytics/monthly-flows`, `GET /analytics/movements` | Totales de la tienda, flujos del año simulado y movimientos derivados de ventas, cierres y cobros. `default_rate` es la razón de cartera vencida a cartera liquidada pendiente. |

El servidor devuelve `{ code, message }` para errores. Usa 403 cuando la sesión de demo carece de acceso, 404 para recursos ausentes, 409 para conflictos de stock, cupo, cotización o cobro, y 422 para condiciones inválidas o pendientes, incluida la capitalización semanal.

Para producción, el frontend espera un proxy del mismo origen hacia el backend para `/api/v1`. El servidor de demo se ejecuta únicamente para desarrollo y pruebas. Quedan pendientes de acuerdo el cálculo semanal, el tratamiento de un período con varios pactos moratorios y los controles operativos del backend.
