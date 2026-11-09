import { BaseEntity, Money } from '@shared/domain';

export type SettlementStatus = 'PENDING' | 'OVERDUE' | 'PAID';

export interface MonthlySettlementProps {
  id: number;
  code: string;
  customerId: number;
  customerName: string;
  cutoffDate: string;
  dueDate: string;
  principalAmount: Money;
  compensatoryInterest: Money;
  penaltyAmount: Money;
  totalDue: Money;
  status: SettlementStatus;
  paidDate?: string;
}

export class MonthlySettlement implements BaseEntity {
  readonly id: number;
  readonly code: string;
  readonly customerId: number;
  readonly customerName: string;
  readonly cutoffDate: string;
  readonly dueDate: string;
  readonly principalAmount: Money;
  readonly compensatoryInterest: Money;
  readonly penaltyAmount: Money;
  readonly totalDue: Money;
  readonly status: SettlementStatus;
  readonly paidDate?: string;

  constructor(props: MonthlySettlementProps) {
    this.id = props.id;
    this.code = props.code;
    this.customerId = props.customerId;
    this.customerName = props.customerName;
    this.cutoffDate = props.cutoffDate;
    this.dueDate = props.dueDate;
    this.principalAmount = props.principalAmount;
    this.compensatoryInterest = props.compensatoryInterest;
    this.penaltyAmount = props.penaltyAmount;
    this.totalDue = props.totalDue;
    this.status = props.status;
    this.paidDate = props.paidDate;
  }

  isPaid(): boolean {
    return this.status === 'PAID';
  }

  isOverdue(): boolean {
    return this.status === 'OVERDUE';
  }
}
