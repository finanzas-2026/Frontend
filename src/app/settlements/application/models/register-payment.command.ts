import { Money } from '@shared/domain';
import { PaymentMethod } from '../../domain/model/payment.entity';

export interface RegisterPaymentCommand {
  settlementId: number;
  amount: Money;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
}
