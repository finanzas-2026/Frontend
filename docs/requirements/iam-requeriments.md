# Identity and tenant requirements

## US-01 Store registration and management

Epic E01. A system administrator can register and manage stores so that each store operates with independent data.

- A global administrator supplies the store identity, name, address, optional contact number and initial administrator account. Saving activates the store and creates its scoped administrator in one transaction.
- Suspending or deactivating a store prevents its accounts from authenticating and blocks requests with tokens issued before the change.

## US-02 Sign-in and role-based access

Epic E01. A customer, store administrator or global administrator can sign in and access the features assigned to their role.

- Valid credentials for an active account open the authorized navigation and establish a JWT session.
- Invalid credentials receive a generic sign-in message that does not identify which credential was incorrect.
