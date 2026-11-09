import { BaseEntity, Money } from '@shared/index';
import { NormalizedRates } from './normalized-rates.vo';
import { Installment } from './installment.entity';

export class AmortizationSchedule implements BaseEntity {
  readonly id: number;
  readonly initialCapital: Money;
  readonly capitalizedCapital: Money;
  readonly graceDays: number;
  readonly totalInstallments: number;
  readonly normalizedRates: NormalizedRates;
  readonly regularInstallment: Money;
  readonly totalInterest: Money;
  readonly totalPayment: Money;
  readonly installments: readonly Installment[];

  constructor(params: {
    id: number;
    initialCapital: Money;
    capitalizedCapital: Money;
    graceDays: number;
    totalInstallments: number;
    normalizedRates: NormalizedRates;
    regularInstallment: Money;
    totalInterest: Money;
    totalPayment: Money;
    installments: readonly Installment[];
  }) {
    this.id = params.id;
    this.initialCapital = params.initialCapital;
    this.capitalizedCapital = params.capitalizedCapital;
    this.graceDays = params.graceDays;
    this.totalInstallments = params.totalInstallments;
    this.normalizedRates = params.normalizedRates;
    this.regularInstallment = params.regularInstallment;
    this.totalInterest = params.totalInterest;
    this.totalPayment = params.totalPayment;
    this.installments = params.installments;
  }
}
