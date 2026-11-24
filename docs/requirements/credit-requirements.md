# Customer credit requirements

## US-05 Customer credit profile

Epic E03. A store administrator can register a customer's credit account and set a credit limit, term, cycle, currency and original compensatory and penalty agreements.

- Both rate agreements store a decimal fraction with seven places, the corresponding reference period and capitalization days when the type is nominal.
- Contact details remain editable while debt is open. Existing debt prevents changes to either rate agreement and the billing cycle.

## US-06 Available credit at checkout

Epic E03. A customer or store administrator can consult available credit during checkout.

- The interface warns when a purchase would exceed the available credit. The server rechecks available credit and inventory when it confirms the sale.
- A successful credit sale consumes the appropriate available credit and updates the inventory.

## US-07 Installment schedule preview

Epic E03. A customer or store administrator can review the French amortization schedule before confirming an installment sale.

- The server applies 30E/360 to the grace period between purchase and cutoff, and capitalizes accrued compensatory interest before calculating the installment.
- The preview shows the installment number, due date, balances, principal and interest. The last installment absorbs any rounding residue.

## US-08 Monthly statement and billing cutoff

Epic E04. A customer can read their statement to review month-end purchases, billed installments and the amount due.

- Closing consolidates purchases, scheduled installments and accrued interest assigned to each completed cycle.
- Purchases after the cutoff date belong to the next cycle. The entire cutoff day remains part of the current cycle.

## US-09 Collection, late interest and receipts

Epic E04. A store administrator can collect and reconcile a customer's statement and issue a receipt.

- An amount below the total due is rejected. Excess tender is recorded as a customer credit balance.
- Overdue principal incurs late interest. Apply the collected amount to late interest, compensatory interest, then principal, and display the recorded allocation on the receipt.
