import { BaseEntity, Money, PaymentMode, Rate } from '@shared/domain';
import { SaleDetail } from './sale-detail.entity';

export interface SaleProps {
  id: number;
  code: string;
  customerId: number;
  customerName: string;
  storeId: number;
  paymentMode: PaymentMode;
  totalAmount: Money;
  monthEndInterest?: Money;
  firstDueDate?: string;
  status: string;
  installmentsCount?: number;
  graceDays?: number;
  tea?: Rate;
  issueDate: string;
  details: SaleDetail[];
}

export class Sale implements BaseEntity {
  readonly id: number;
  readonly code: string;
  readonly customerId: number;
  readonly customerName: string;
  readonly storeId: number;
  readonly paymentMode: PaymentMode;
  readonly totalAmount: Money;
  readonly monthEndInterest?: Money;
  readonly firstDueDate?: string;
  readonly status: string;
  readonly installmentsCount?: number;
  readonly graceDays?: number;
  readonly tea?: Rate;
  readonly issueDate: string;
  readonly details: SaleDetail[];

  constructor(props: SaleProps) {
    this.id = props.id;
    this.code = props.code;
    this.customerId = props.customerId;
    this.customerName = props.customerName;
    this.storeId = props.storeId;
    this.paymentMode = props.paymentMode;
    this.totalAmount = props.totalAmount;
    this.monthEndInterest = props.monthEndInterest;
    this.firstDueDate = props.firstDueDate;
    this.status = props.status;
    this.installmentsCount = props.installmentsCount;
    this.graceDays = props.graceDays;
    this.tea = props.tea;
    this.issueDate = props.issueDate;
    this.details = props.details;
  }

  get itemsCount(): number {
    return this.details.reduce((acc, d) => acc + d.quantity, 0);
  }
}
