// Sales Bounded Context Public API

// Domain Models & Entities
export * from './domain/model/sale.entity';
export * from './domain/model/sale-detail.entity';
export * from './domain/model/customer-credit-info.entity';
export * from './domain/model/catalog-product.entity';

// Domain Rules
export * from './domain/rules/credit-availability.rule';
export * from './domain/rules/monthly-payment-eligibility.rule';

// Domain Repositories
export * from './domain/repositories/sales.repository';

// Application
export * from './application/models/create-sale.command';
export * from './application/use-cases/create-sale.use-case';
export * from './application/use-cases/get-sale-by-id.use-case';
export * from './application/use-cases/list-sales.use-case';
export * from './application/use-cases/get-customers.use-case';
export * from './application/use-cases/get-catalog-products.use-case';

// Infrastructure Providers
export * from './infrastructure/sales.providers';

// Presentation State & Routes
export * from './presentation/state/cart.store';
export * from './presentation/sales.routes';
