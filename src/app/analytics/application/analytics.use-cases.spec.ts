import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import { Money, Rate } from '@shared/domain';
import { DashboardKpis } from '../domain/model/dashboard-kpis.vo';
import { MonthlyFlow } from '../domain/model/monthly-flow.vo';
import { AuditMovement } from '../domain/model/audit-movement.entity';
import {
  ANALYTICS_REPOSITORY,
  AnalyticsRepository,
} from '../domain/repositories/analytics.repository';
import { GetDashboardKpisUseCase } from './use-cases/get-dashboard-kpis.use-case';
import { GetMonthlyFlowsUseCase } from './use-cases/get-monthly-flows.use-case';
import { ListAuditMovementsUseCase } from './use-cases/list-audit-movements.use-case';

describe('Analytics BC - Use Cases', () => {
  let mockRepo: Partial<AnalyticsRepository>;
  let getKpisUseCase: GetDashboardKpisUseCase;
  let getFlowsUseCase: GetMonthlyFlowsUseCase;
  let listMovementsUseCase: ListAuditMovementsUseCase;

  const mockKpis = new DashboardKpis({
    totalRevenue: Money.fromString('14850.00').unwrap(),
    overduePortfolio: Money.fromString('828.69').unwrap(),
    activeAccounts: 42,
    defaultRate: Rate.fromPercent('5.58').unwrap(),
  });

  const mockFlow = new MonthlyFlow({
    month: 'Ene',
    salesAmount: Money.fromString('12400.00').unwrap(),
    collectedAmount: Money.fromString('11800.00').unwrap(),
  });

  const mockMovement = new AuditMovement({
    id: 1,
    timestamp: '2026-11-10T12:05:00Z',
    eventType: 'PAYMENT_RECEIVED',
    customerName: 'Juan Perez',
    amount: Money.fromString('828.69').unwrap(),
    description: 'Cancelación total',
  });

  beforeEach(() => {
    mockRepo = {
      getDashboardKpis: () => of(mockKpis),
      getMonthlyFlows: () => of([mockFlow]),
      listAuditMovements: () => of([mockMovement]),
    };

    TestBed.configureTestingModule({
      providers: [
        GetDashboardKpisUseCase,
        GetMonthlyFlowsUseCase,
        ListAuditMovementsUseCase,
        { provide: ANALYTICS_REPOSITORY, useValue: mockRepo },
      ],
    });

    getKpisUseCase = TestBed.inject(GetDashboardKpisUseCase);
    getFlowsUseCase = TestBed.inject(GetMonthlyFlowsUseCase);
    listMovementsUseCase = TestBed.inject(ListAuditMovementsUseCase);
  });

  it('debe obtener métricas del dashboard correctamente', async () => {
    const res = await getKpisUseCase.execute();
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.totalRevenue.toString()).toBe('14850.00');
      expect(res.value.activeAccounts).toBe(42);
      expect(res.value.defaultRate.toPercentString()).toBe('5.5800000%');
    }
  });

  it('debe obtener flujos mensuales correctamente', async () => {
    const res = await getFlowsUseCase.execute();
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.length).toBe(1);
      expect(res.value[0]?.month).toBe('Ene');
    }
  });

  it('debe listar movimientos de auditoría correctamente', async () => {
    const res = await listMovementsUseCase.execute();
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.length).toBe(1);
      expect(res.value[0]?.eventType).toBe('PAYMENT_RECEIVED');
    }
  });
});
