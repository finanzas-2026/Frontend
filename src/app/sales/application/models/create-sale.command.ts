import { Money, PaymentMode, Rate } from '@shared/domain';

export interface CreateSaleDetailItem {
  productId: number;
  quantity: number;
  unitPrice: Money;
}

export interface CreateSaleCommand {
  customerId: number;
  storeId: number;
  paymentMode: PaymentMode;
  installmentsCount?: number;
  graceDays?: number;
  tea?: Rate;
  firstDueDate?: string;
  idempotencyKey?: string;
  details: CreateSaleDetailItem[];
}
