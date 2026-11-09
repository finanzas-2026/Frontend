// Analytics Bounded Context Public API

// Domain Models & Value Objects
export * from './domain/model/dashboard-kpis.vo';
export * from './domain/model/monthly-flow.vo';
export * from './domain/model/audit-movement.entity';

// Domain Repositories
export * from './domain/repositories/analytics.repository';

// Application Use Cases
export * from './application/use-cases/get-dashboard-kpis.use-case';
export * from './application/use-cases/get-monthly-flows.use-case';
export * from './application/use-cases/list-audit-movements.use-case';

// Infrastructure Providers
export * from './infrastructure/analytics.providers';

// Presentation State & Routes
export * from './presentation/state/dashboard.store';
export * from './presentation/analytics.routes';
