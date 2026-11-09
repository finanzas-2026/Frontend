import { BaseEntity, Money } from '@shared/domain';

export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'YAPE';

export interface PaymentProps {
  id: number;
  code: string;
  settlementId: number;
  customerId: number;
  amount: Money;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  receiptNumber: string;
}

export class Payment implements BaseEntity {
  readonly id: number;
  readonly code: string;
  readonly settlementId: number;
  readonly customerId: number;
  readonly amount: Money;
  readonly paymentDate: string;
  readonly paymentMethod: PaymentMethod;
  readonly referenceNumber?: string;
  readonly receiptNumber: string;

  constructor(props: PaymentProps) {
    this.id = props.id;
    this.code = props.code;
    this.settlementId = props.settlementId;
    this.customerId = props.customerId;
    this.amount = props.amount;
    this.paymentDate = props.paymentDate;
    this.paymentMethod = props.paymentMethod;
    this.referenceNumber = props.referenceNumber;
    this.receiptNumber = props.receiptNumber;
  }
}
