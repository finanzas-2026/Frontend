# Proximity Credit architecture

Angular provides the Spanish-language staff and customer interfaces. Feature pages coordinate UI state and call application use cases. Infrastructure adapters map HTTP responses into domain types. Reusable page headers, tables, empty states, SVG icons and notifications live under `src/app/shared/presentation`.

Nginx serves Angular and forwards `/api/v1` to Spring Boot on the same origin. Spring enforces authorization and business rules. PostgreSQL stores business records. Flyway applies the schema and Hibernate validates it.

| Context | Responsibility | Tables |
| --- | --- | --- |
| Identity and tenant management | Authenticate accounts, manage stores and resolve tenant and role from the session. | `stores`, `users` |
| Catalog and inventory | Manage products, prices, installment eligibility and stock. | `products` |
| Customer credit | Manage a customer's original credit terms, credit limit and credit balance. | `customers` |
| Sales | Validate catalog prices and credit, reserve stock and persist sales and their lines. | `sales`, `sale_details` |
| Finance | Normalize the original rates and calculate French installment schedules. | `amortization_schedules` |
| Billing and collections | Close completed cycles, record full payments and allocate them to late interest, compensatory interest and principal. | `monthly_settlements`, `payments` |
| Analytics | Read tenant-scoped sales, payments and statements for KPIs and audit history. | Derived from financial records |

## Integration boundaries

- Store onboarding creates the store and administrator in one transaction. Customer onboarding creates the account and credit profile in one transaction. Authorization on protected routes resolves the store from the authenticated account and checks its current status.
- The server checks the quoted total against current catalog prices, stock levels and credit. A successful sale records the inventory adjustment and the sale in one transaction. Installment sales also persist a schedule.
- The POS previews the same rate, commercial grace period and payment day that are used to confirm the sale. The customer's active rate and billing cycle stay fixed while qualifying debt remains open.
- Daily billing and the manual cutoff process share the same service. The billing cycle uses dates in `America/Lima`. The rolling close bills outstanding sales and installments from completed cutoff dates even after downtime.
- A full collection updates the statement, payment and customer credit balance in one transaction. A stored idempotency key returns the same receipt on retry. The dashboard reconciles movements from the same persisted records.

See the [API contract](../api-contract.md), [database diagram](database-diagram.md) and [domain constants](constants.md).
