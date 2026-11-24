# Proximity Credit database

The diagram shows the PostgreSQL entities used by the Docker stack and the main keys and contract fields. The Flyway baseline in the backend repository defines the full schema.

- Both customer rates retain their original decimal fraction and reference period. Capitalization is present only for a nominal rate.
- Product installment eligibility is stored in `allows_installments`. The system operates in PEN.
- A month-end sale links to its settlement once billed. Installment sales link through their individual schedule rows.
- A payment records the amount received, the amount allocated to the debt and the resulting credit balance.

```plantuml
@startuml
skinparam dpi 180
skinparam defaultFontName Liberation Sans
skinparam linetype ortho
hide circle
left to right direction

entity stores {
  * store_id : integer <<PK>>
  --
  business_name : varchar(100)
  tax_id : varchar(20)
  phone_number : varchar(20)
  status : varchar(20)
}
entity users {
  * user_id : integer <<PK>>
  --
  store_id : integer <<FK>>
  username : varchar(50)
  password_hash : varchar(255)
  user_type : varchar(20)
}
entity customers {
  * customer_id : integer <<PK>>
  --
  store_id : integer <<FK>>
  user_id : integer <<FK, UNIQUE>>
  credit_limit : decimal(12,2)
  cutoff_day : integer
  payment_due_day : integer
  compensatory_rate_type : varchar(10)
  compensatory_rate_value : decimal(12,7)
  compensatory_rate_period_days : integer
  compensatory_capitalization_days : integer
  penalty_rate_type : varchar(10)
  penalty_rate_value : decimal(12,7)
  penalty_rate_period_days : integer
  penalty_capitalization_days : integer
  credit_currency : varchar(3)
  favour_balance : decimal(12,2)
}
entity products {
  * product_id : integer <<PK>>
  --
  store_id : integer <<FK>>
  cash_price : decimal(12,2)
  credit_list_price : decimal(12,2)
  allows_installments : boolean
  current_stock : integer
  status : varchar(20)
}
entity sales {
  * sale_id : integer <<PK>>
  --
  store_id : integer <<FK>>
  customer_id : integer <<FK>>
  settlement_id : integer <<FK>>
  total_amount : decimal(12,2)
  payment_mode : varchar(25)
  tea : decimal(12,7)
  penalty_tea : decimal(12,7)
  billing_cutoff_date : date
  first_due_date : date
  sale_status : varchar(20)
  idempotency_key : varchar(100)
}
entity sale_details {
  * sale_detail_id : integer <<PK>>
  --
  sale_id : integer <<FK>>
  product_id : integer <<FK>>
  quantity : integer
  unit_price : decimal(12,2)
  subtotal : decimal(12,2)
}
entity amortization_schedules {
  * schedule_id : integer <<PK>>
  --
  sale_id : integer <<FK>>
  settlement_id : integer <<FK>>
  billing_cutoff_date : date
  due_date : date
  principal_amount : decimal(12,2)
  compensatory_interest : decimal(12,2)
  fixed_installment : decimal(12,2)
  ending_balance : decimal(12,2)
}
entity monthly_settlements {
  * settlement_id : integer <<PK>>
  --
  customer_id : integer <<FK>>
  cutoff_date : date
  payment_due_date : date
  total_amount_due : decimal(12,2)
  pending_balance : decimal(12,2)
  settlement_status : varchar(20)
}
entity payments {
  * payment_id : integer <<PK>>
  --
  settlement_id : integer <<FK>>
  amount_paid : decimal(12,2)
  received_amount : decimal(12,2)
  allocated_to_penalty : decimal(12,2)
  allocated_to_interest : decimal(12,2)
  allocated_to_principal : decimal(12,2)
  favour_balance_after : decimal(12,2)
  idempotency_key : varchar(100)
}

stores |o--o{ users
stores ||--o{ customers
users ||--o| customers
stores ||--o{ products
stores ||--o{ sales
customers ||--o{ sales
customers ||--o{ monthly_settlements
sales ||--|{ sale_details
products ||--o{ sale_details
sales ||--o{ amortization_schedules
monthly_settlements |o--o{ amortization_schedules
monthly_settlements |o--o{ sales
monthly_settlements ||--o{ payments
@enduml
```
