import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Money, Rate, RateTypes } from '@shared/index';
import { SimulateScheduleUseCase } from './use-cases/simulate-schedule.use-case';
import { FINANCING_REPOSITORY } from '../domain/repositories/financing.repository';
import { FinancingAssembler } from '../infrastructure/mappers/financing.assembler';
import { SimulateScheduleResponseDto } from '../infrastructure/dto/simulate-schedule-response.dto';

const CASE_1_DTO: SimulateScheduleResponseDto = {
  initial_capital: '1500.00',
  capitalized_capital: '1515.07',
  grace_days: 15,
  total_installments: 3,
  tea: '0.2711545',
  ted: '0.0006667',
  tep_30: '0.0201993',
  regular_installment: '525.52',
  total_interest: '76.69',
  total_payment: '1576.69',
  installments: [
    {
      id: 1,
      installment_number: 0,
      due_date: '2026-01-15',
      payment_amount: '0.00',
      principal_amount: '0.00',
      interest_amount: '15.07',
      balance_amount: '1515.07',
      is_grace_period: true,
    },
    {
      id: 2,
      installment_number: 1,
      due_date: '2026-02-15',
      payment_amount: '525.52',
      principal_amount: '494.92',
      interest_amount: '30.60',
      balance_amount: '1020.15',
      is_grace_period: false,
    },
    {
      id: 3,
      installment_number: 2,
      due_date: '2026-03-15',
      payment_amount: '525.52',
      principal_amount: '504.91',
      interest_amount: '20.61',
      balance_amount: '515.24',
      is_grace_period: false,
    },
    {
      id: 4,
      installment_number: 3,
      due_date: '2026-04-15',
      payment_amount: '525.65',
      principal_amount: '515.24',
      interest_amount: '10.41',
      balance_amount: '0.00',
      is_grace_period: false,
    },
  ],
};

describe('SimulateScheduleUseCase', () => {
  function setup() {
    const schedule = new FinancingAssembler().toScheduleFromResponse(CASE_1_DTO);
    TestBed.configureTestingModule({
      providers: [
        SimulateScheduleUseCase,
        {
          provide: FINANCING_REPOSITORY,
          useValue: { simulateSchedule: () => of(schedule) },
        },
      ],
    });
    return TestBed.inject(SimulateScheduleUseCase);
  }

  it('should delegate the simulation to the repository and return the schedule', async () => {
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
