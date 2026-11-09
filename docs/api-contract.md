# Especificación de Contratos de API REST — Sistema de Crédito Comercial

**Proyecto Académico:** Finanzas e Ingeniería Económica (1ASI0642) — UPC, Grupo 5.  
**Versión de API:** `v1`  
**Base URL:** `/api/v1`  
**Formato de Serialización de Red:** JSON con claves en `snake_case`.  
**Aritmética Monetaria:** Importes monetarios serializados como `string` con 2 decimales fijos (ej. `"1500.00"` en Soles PEN).  
**Tasas de Interés:** Serializadas como `string` con mínimo 7 decimales significativos o porcentaje normalizado (ej. `"24.0000000"`).

---

## 1. Convenciones Generales y Estándares de Red

### 1.1 Encabezados HTTP
- `Content-Type: application/json`
- `Accept: application/json`
- `Authorization: Bearer <jwt_token>` (en rutas autenticadas)

### 1.2 Formato Estándar de Respuesta de Error (`AppError` / `BaseResponse`)
```json
{
  "code": "ERROR_CODE_STRING",
  "message": "Descripción clara del error para el usuario",
  "details": { ... },
  "timestamp": "2026-11-09T18:00:00Z"
}
```

### 1.3 Códigos de Estado HTTP
- `200 OK`: Operación de lectura o actualización exitosa.
- `201 Created`: Recurso creado exitosamente (venta, pago, liquidación).
- `400 Bad Request`: Payload no cumple con esquema Zod o parámetros inválidos.
- `401 Unauthorized`: Token de sesión ausente o expirado.
- `403 Forbidden`: Permiso insuficiente para el almacén o acción.
- `409 Conflict`: Conflicto de negocio (ej. cuota ya cancelada, stock insuficiente, línea de crédito excedida).
- `422 Unprocessable Entity`: Violación de regla de negocio o cálculo financiero (ej. pago parcial no permitido).

---

## 2. Bounded Context: `financing` (Motor Financiero)

### 2.1 `POST /api/v1/finance/simulate`
Genera el cronograma de amortización francesa en base commercial 360/30 con ajuste terminal de céntimos ($S_n = 0.00$) y período de gracia total (Art. 1250 C.C.).

#### Request Body (`SimulateScheduleRequestDto`)
```json
{
  "principal": "1500.00",
  "rate_type": "EFECTIVA",
  "nominal_rate": null,
  "effective_annual_rate": "24.0000000",
  "capitalization_days": 30,
  "total_installments": 3,
  "grace_period_months": 1,
  "start_date": "2026-11-01"
}
```

#### Response Body (`SimulateScheduleResponseDto`) - `200 OK`
```json
{
  "installments": [
    {
      "number": 1,
      "due_date": "2026-12-01",
      "initial_balance": "1500.00",
      "interest": "27.00",
      "amortization": "0.00",
      "installment_amount": "0.00",
      "ending_balance": "1527.00",
      "status": "GRACE"
    },
    {
      "number": 2,
      "due_date": "2027-01-01",
      "initial_balance": "1527.00",
      "interest": "27.49",
      "amortization": "749.62",
      "installment_amount": "777.11",
      "ending_balance": "777.38",
      "status": "PENDING"
    },
    {
      "number": 3,
      "due_date": "2027-02-01",
      "initial_balance": "777.38",
      "interest": "14.00",
      "amortization": "777.38",
      "installment_amount": "791.38",
      "ending_balance": "0.00",
      "status": "PENDING"
    }
  ],
  "total_interest": "68.49",
  "total_amount": "1568.49"
}
```

---

## 3. Bounded Context: `sales` (Ventas y Carrito POS)

### 3.1 `GET /api/v1/customers`
Listado de clientes para selección en el punto de venta.

#### Response Body - `200 OK`
```json
[
  {
    "id": 1,
    "first_name": "Juan",
    "last_name": "Perez Mamani",
    "document_type": "DNI",
    "document_number": "10458792",
    "credit_limit": "3000.00",
    "used_credit": "1250.00",
    "available_credit": "1750.00",
    "allows_monthly_payments": true,
    "status": "ACTIVE"
  }
]
```

### 3.2 `GET /api/v1/catalog/products`
Catálogo de productos para el mostrador.

#### Response Body - `200 OK`
```json
[
  {
    "id": 1,
    "code": "PROD-001",
    "name": "Arroz Costeño Extra 5kg",
    "price": "23.50",
    "stock": 45,
    "unit": "BOLSA"
  }
]
```

### 3.3 `POST /api/v1/sales`
Registra una venta comercial con afectación atómica de inventario y saldo de línea de crédito.

#### Request Body (`CreateSaleRequestDto`)
```json
{
  "customer_id": 1,
  "payment_mode": "FINANCIADO_CUOTAS",
  "installments_count": 3,
  "interest_rate": "24.0000000",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": "23.50"
    }
  ]
}
```

#### Response Body (`SaleResponseDto`) - `201 Created`
```json
{
  "id": 105,
  "code": "VTA-2026-0005",
  "customer_id": 1,
  "customer_name": "Juan Perez Mamani",
  "issue_date": "2026-11-09T18:00:00Z",
  "payment_mode": "FINANCIADO_CUOTAS",
  "subtotal": "47.00",
  "interest_amount": "1.85",
  "total_amount": "48.85",
  "status": "COMPLETED",
  "details": [
    {
      "product_id": 1,
      "product_name": "Arroz Costeño Extra 5kg",
      "quantity": 2,
      "unit_price": "23.50",
      "subtotal": "47.00"
    }
  ]
}
```

### 3.4 `GET /api/v1/sales`
Historial de transacciones de venta.

#### Response Body - `200 OK`
```json
[
  {
    "id": 105,
    "code": "VTA-2026-0005",
    "customer_id": 1,
    "customer_name": "Juan Perez Mamani",
    "issue_date": "2026-11-09T18:00:00Z",
    "payment_mode": "FINANCIADO_CUOTAS",
    "total_amount": "48.85",
    "status": "COMPLETED"
  }
]
```

---

## 4. Bounded Context: `settlements` (Cierre y Cobranza Legal)

### 4.1 `GET /api/v1/settlements`
Listado de liquidaciones mensuales por fecha de corte.

#### Response Body - `200 OK`
```json
[
  {
    "id": 1,
    "code": "LIQ-2026-10-0001",
    "customer_id": 1,
    "customer_name": "Juan Perez Mamani",
    "period_month": 10,
    "period_year": 2026,
    "cutoff_date": "2026-10-31",
    "due_date": "2026-11-05",
    "principal_amount": "800.00",
    "interest_amount": "25.00",
    "moratorium_amount": "3.69",
    "total_due": "828.69",
    "status": "OVERDUE"
  }
]
```

### 4.2 `GET /api/v1/settlements/:id/payoff-quote`
Cotización de cancelación a la fecha actual, computando días de atraso e interés moratorio estricto sobre capital vencido (Art. 1249/1250 C.C.).

#### Response Body (`PayoffQuoteResponseDto`) - `200 OK`
```json
{
  "settlement_id": 1,
  "calculation_date": "2026-11-15",
  "principal_amount": "800.00",
  "compensatory_interest": "25.00",
  "moratorium_rate_tea": "18.0000000",
  "overdue_days": 10,
  "moratorium_penalty": "3.69",
  "total_payoff_amount": "828.69",
  "legal_imputation_order": [
    { "step": 1, "concept": "INTERES_MORATORIO", "amount": "3.69" },
    { "step": 2, "concept": "INTERES_COMPENSATORIO", "amount": "25.00" },
    { "step": 3, "concept": "CAPITAL_VENCIDO", "amount": "800.00" }
  ]
}
```

### 4.3 `POST /api/v1/settlements/:id/pay`
Registra el cobro en ventanilla aplicando prelación Art. 1257 C.C. y exigiendo pago total estricto.

#### Request Body (`RegisterPaymentRequestDto`)
```json
{
  "amount": "828.69",
  "payment_method": "EFECTIVO",
  "notes": "Cancelación total con mora en ventanilla"
}
```

#### Response Body (`PaymentResponseDto`) - `201 Created`
```json
{
  "payment_id": 501,
  "settlement_id": 1,
  "receipt_code": "REC-2026-0001",
  "paid_amount": "828.69",
  "moratorium_applied": "3.69",
  "compensatory_applied": "25.00",
  "principal_applied": "800.00",
  "change_returned": "0.00",
  "timestamp": "2026-11-15T10:15:00Z",
  "status": "SETTLED"
}
```

### 4.4 `POST /api/v1/settlements/cutoff`
Ejecuta el cierre de facturación mensual para todos los clientes activos.

#### Response Body - `200 OK`
```json
{
  "processed_count": 42,
  "generated_settlements": 15,
  "total_principal": "12500.00",
  "timestamp": "2026-11-09T18:00:00Z"
}
```

### 4.5 `POST /api/v1/settlements/advance-date`
Avanza el reloj virtual de simulación comercial.

#### Request Body
```json
{
  "days": 10
}
```

#### Response Body - `200 OK`
```json
{
  "new_current_date": "2026-11-19",
  "days_advanced": 10
}
```

---

## 5. Bounded Context: `analytics` (MIS y Auditoría)

### 5.1 `GET /api/v1/analytics/kpis`
Métricas e indicadores ejecutivos clave para la gerencia.

#### Response Body (`DashboardKpisResponseDto`) - `200 OK`
```json
{
  "total_revenue": "14850.00",
  "overdue_portfolio": "828.69",
  "active_accounts": 42,
  "default_rate": "5.5800000"
}
```

### 5.2 `GET /api/v1/analytics/monthly-flows`
Serie histórica de 12 meses para el gráfico comparativo de facturación vs. cobranza.

#### Response Body (`MonthlyFlowDto[]`) - `200 OK`
```json
[
  { "month": "Ene", "sales_amount": "12400.00", "collected_amount": "11800.00" },
  { "month": "Feb", "sales_amount": "13100.00", "collected_amount": "12500.00" },
  { "month": "Dic", "sales_amount": "18500.00", "collected_amount": "17900.00" }
]
```

### 5.3 `GET /api/v1/analytics/movements`
Bitácora inmutable de trazabilidad de operaciones financieras.

#### Response Body (`AuditMovementDto[]`) - `200 OK`
```json
[
  {
    "id": 1,
    "timestamp": "2026-11-10T12:05:00Z",
    "event_type": "PAYMENT_RECEIVED",
    "customer_name": "Juan Perez Mamani",
    "amount": "828.69",
    "description": "Cancelación total de liquidación LIQ-2026-10-0001 en mora"
  }
]
```
