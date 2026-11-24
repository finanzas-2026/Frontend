# Backend API Contract

The application calls the Spring backend under `/api/v1` through a same-origin proxy. Every protected request carries `Authorization: Bearer <token>`. Tenant identity is derived from the JWT; frontend requests never choose a `store_id` or send `X-Store-Id`.

## Authentication and roles

`POST /auth/login` accepts `{ "identifier": "...", "password": "..." }` and returns `{ "token", "userId", "username", "email", "userType", "storeId" }`. `GET /auth/me` validates a restored Bearer token and returns the current identity fields `{ "userId", "username", "email", "userType", "storeId" }`. Role values are `SUPER_ADMIN`, `STORE_ADMIN`, and `CUSTOMER`.

Store creation is restricted to `SUPER_ADMIN`: `POST /stores` accepts store fields plus a nested `admin` object containing `first_name`, `last_name`, `email`, `username`, and `password`. Store listing and detail are available to super admins. `PATCH /stores/{id}` updates fields or changes status to `INACTIVE`; store status values are `ACTIVE`, `INACTIVE`, and `SUSPENDED`.

Store admins manage customers and products for their token's store. `POST /customers` creates a customer account and profile atomically. `PUT /customers/{id}` updates profile fields without account credentials or tenant identifiers. Customer records are not physically deleted. Product create/update fields are `name`, `description`, `brand`, `supplier`, `unit_of_measure`, `image_url`, `cash_price`, `credit_list_price`, `allows_installments`, `current_stock`, `min_stock`, and `status`. Product status values are `AVAILABLE`, `OUT_OF_STOCK`, and `DISCONTINUED`; deactivation uses `PATCH`, not physical deletion. Wire unit values are `KG`, `LITER`, `UNIT`, `PACK`, and `BAG`.

## Sales and financing

Business JSON uses snake_case. Profile CRUD values such as amounts and rates are JSON numbers; finance, sales, settlement, and analytics projections use decimal strings. Currency is PEN. Rate types are `NOMINAL` and `EFFECTIVE` (rates are fractions, so 18% is `0.18`). Payment modes are `CASH`, `MONTH_END`, and `INSTALLMENTS`. Payment methods are `CASH`, `BANK_TRANSFER`, and `YAPE`.

| Endpoint | Contract |
| --- | --- |
| `POST /finance/simulate` | Accepts `initial_capital`, `rate_type`, `rate_value`, `rate_period_days`, `compounding_days` for nominal rates, `total_installments`, and optional `grace_days` and `first_due_date`. POS requests also send `customer_id`; the backend applies the customer's rate and billing calendar, including grace days and the first due date. Returns normalized rates, schedule rows, and totals. |
| `GET /sales/customers` | Returns the store's checkout projection, including credit availability, installment terms, and `allows_monthly_payments` eligibility. |
| `GET /catalog/products` | Returns active checkout products with cash and credit prices, stock, category codes, and `allows_installments`. Category codes are `GROCERIES`, `BEVERAGES`, `FRESH`, and `GENERAL`. |
| `GET /sales`, `GET /sales/{id}` | Lists or retrieves store sales. |
| `POST /sales` | Requires `Idempotency-Key` and accepts `customer_id`, `payment_mode`, `details: [{product_id, quantity}]`, and `expected_total`. `INSTALLMENTS` also sends `installments_count`, `grace_days`, `tea`, and `first_due_date` from the current customer-specific preview. No store or unit price is sent. The backend rechecks stock, eligibility, price, credit, schedule, and quote freshness. |

## Settlements and analytics

| Endpoint | Contract |
| --- | --- |
| `GET /settlements`, `GET /settlements/{id}` | Lists or retrieves settlements visible to the current role. |
| `POST /settlements/cutoff` | Store admin only. Has no business-date body; backend clock and billing calendar select eligible sales. Repeating a cutoff must not duplicate settlements. |
| `GET /settlements/{id}/payoff-quote` | Returns the current calculation date, overdue days, overdue principal, compensatory interest, moratorium interest, and total payoff amount. |
| `POST /settlements/{id}/pay` | Requires `Idempotency-Key` (UUID) and accepts the received `amount`, `payment_method`, and optional `reference_number`. The received amount must cover the current quote. The backend applies only the debt amount and records any overpayment as customer favour. The receipt includes the recorded allocation to late interest, compensatory interest and principal. A retry with the same key and payload returns the same receipt. |
| `GET /analytics/kpis`, `GET /analytics/monthly-flows`, `GET /analytics/movements` | Returns tenant-scoped totals, flows, and audit movements. `default_rate` is a fraction; `reference_code` is the localized movement reference when present. |

Errors use `{ "code", "message" }`, with machine-readable codes and diagnostic messages in English. Angular translates the codes to Spanish for users. The application displays localized labels for enums and never relies on English backend descriptions.

## End-to-end environment

Start an isolated backend Compose project with the basic seed and the test clock. Example in PowerShell:

```powershell
# Backend checkout
$env:FRONTEND_PORT = '4210'
$env:DEMO_CLOCK_ENABLED = 'true'
$env:DEMO_CLOCK_DATE = '2026-11-25'
docker compose -p proximity-credit-e2e up -d --build --wait

# Frontend checkout
$env:E2E_BASE_URL = 'http://localhost:4210'
npm run e2e
```

The suite defaults to the local seed credentials. Override them with `E2E_ADMIN_*`, `E2E_CUSTOMER_*` and `E2E_SUPER_ADMIN_*` as needed. The settlement scenario advances the isolated clock by one day through the test-only endpoint.
