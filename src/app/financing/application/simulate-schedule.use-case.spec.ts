import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { server } from '@mocks/server';
import { Money, Rate, RateTypes, API_BASE_URL } from '@shared/index';
import { SimulateScheduleUseCase } from './use-cases/simulate-schedule.use-case';
import { provideFinancing } from '../infrastructure/financing.providers';

describe('SimulateScheduleUseCase Integration with MSW', () => {
  beforeAll(() => server.listen({ onUnhandledFrame: 'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideFinancing(),
        { provide: API_BASE_URL, useValue: 'http://localhost/api/v1' },
      ],
    });
    return TestBed.inject(SimulateScheduleUseCase);
  }

  it('should successfully execute simulation for Caso de Prueba 1', async () => {
    const useCase = setup();
    const result = await useCase.execute({
      initialCapital: Money.fromString('1500.00').unwrap(),
      rate: Rate.fromPercent(24).unwrap(),
      rateType: RateTypes.NOMINAL,
      compoundingDays: 360,
      totalInstallments: 3,
      graceDays: 15,
      firstDueDate: '2026-01-15',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const schedule = result.value;
      expect(schedule.capitalizedCapital.toString()).toBe('1515.07');
      expect(schedule.installments).toHaveLength(4); // row 0 + 3 cuotas
      expect(schedule.installments[0]?.isGracePeriod).toBe(true);
      expect(schedule.installments[3]?.balanceAmount.toString()).toBe('0.00');
    }
  });

  it('should reject invalid capital or term', async () => {
    const useCase = setup();
    const badCapitalResult = await useCase.execute({
      initialCapital: Money.zero(),
      rate: Rate.fromPercent(24).unwrap(),
      rateType: RateTypes.NOMINAL,
      totalInstallments: 3,
    });
    expect(badCapitalResult.isErr()).toBe(true);

    const badTermResult = await useCase.execute({
      initialCapital: Money.fromString('100.00').unwrap(),
      rate: Rate.fromPercent(24).unwrap(),
      rateType: RateTypes.NOMINAL,
      totalInstallments: 0,
    });
    expect(badTermResult.isErr()).toBe(true);
  });
});
