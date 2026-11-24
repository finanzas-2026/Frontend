import { DomainError, Money, PaymentMode, PaymentModes, Result, ok, err } from '@shared/domain';
import { CustomerCreditInfo } from '../model/customer-credit-info.entity';

export class CreditAvailabilityRule {
  static validate(
    customer: CustomerCreditInfo,
    saleTotal: Money,
    paymentMode: PaymentMode
  ): Result<void, DomainError> {
    if (paymentMode === PaymentModes.CASH) {
      return ok(undefined);
    }

    const available = customer.availableCredit;
    if (saleTotal.isGreaterThan(available)) {
      return err(
        new DomainError(
          'CREDIT_LIMIT_EXCEEDED',
          `El importe de la venta (${saleTotal.toFormatted()}) excede la línea de crédito disponible del cliente (${available.toFormatted()}).`
        )
      );
    }

    return ok(undefined);
  }
}
