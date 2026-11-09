import { BaseEntity, Money } from '@shared/index';

export class Installment implements BaseEntity {
  readonly id: number;
  readonly installmentNumber: number;
  readonly dueDate: string;
  readonly paymentAmount: Money;
  readonly principalAmount: Money;
  readonly interestAmount: Money;
  readonly balanceAmount: Money;
  readonly isGracePeriod: boolean;

  constructor(params: {
    id: number;
    installmentNumber: number;
    dueDate: string;
    paymentAmount: Money;
    principalAmount: Money;
    interestAmount: Money;
    balanceAmount: Money;
    isGracePeriod: boolean;
  }) {
    this.id = params.id;
    this.installmentNumber = params.installmentNumber;
    this.dueDate = params.dueDate;
    this.paymentAmount = params.paymentAmount;
    this.principalAmount = params.principalAmount;
    this.interestAmount = params.interestAmount;
    this.balanceAmount = params.balanceAmount;
    this.isGracePeriod = params.isGracePeriod;
  }
}
