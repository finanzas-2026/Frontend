import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Money, Rate, RateType } from '@shared/index';
import { AmortizationSchedule } from '../model/amortization-schedule.entity';

export interface FinancingSimulationParams {
  readonly initialCapital: Money;
  readonly rate: Rate;
  readonly rateType: RateType;
  readonly compoundingDays?: number;
  readonly ratePeriodDays?: number;
  readonly customerId?: number;
  readonly totalInstallments: number;
  readonly graceDays?: number;
  readonly firstDueDate?: string;
}

export interface FinancingRepository {
  simulateSchedule(params: FinancingSimulationParams): Observable<AmortizationSchedule>;
}

export const FINANCING_REPOSITORY = new InjectionToken<FinancingRepository>('FINANCING_REPOSITORY');
