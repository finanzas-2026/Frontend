import { BaseEntity, Money } from '@shared/domain';

export interface AgreedCreditTerms {
  maxMonths: number;
  rateType: 'NOMINAL' | 'EFFECTIVE';
  rateValue: string;
  ratePeriodDays: number;
  compoundingDays: number | null;
}

export interface CustomerCreditInfoProps {
  terms?: AgreedCreditTerms;
  id: number;
  fullName: string;
  documentNumber: string;
  creditLimit: Money;
  currentDebt: Money;
  allowsMonthlyPayments: boolean;
}

export class CustomerCreditInfo implements BaseEntity {
  readonly terms?: AgreedCreditTerms;
  readonly id: number;
  readonly fullName: string;
  readonly documentNumber: string;
  readonly creditLimit: Money;
  readonly currentDebt: Money;
  readonly allowsMonthlyPayments: boolean;

  constructor(props: CustomerCreditInfoProps) {
    this.terms = props.terms;
    this.id = props.id;
    this.fullName = props.fullName;
    this.documentNumber = props.documentNumber;
    this.creditLimit = props.creditLimit;
    this.currentDebt = props.currentDebt;
    this.allowsMonthlyPayments = props.allowsMonthlyPayments;
  }

  get availableCredit(): Money {
    if (this.currentDebt.isGreaterThanOrEqual(this.creditLimit)) {
      return Money.zero();
    }
    return this.creditLimit.subtract(this.currentDebt);
  }
}
