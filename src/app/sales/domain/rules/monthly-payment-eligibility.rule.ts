import { DomainError, PaymentMode, PaymentModes, Result, ok, err } from '@shared/domain';
import { CustomerCreditInfo } from '../model/customer-credit-info.entity';

export class MonthlyPaymentEligibilityRule {
  static validate(
    customer: CustomerCreditInfo,
    paymentMode: PaymentMode
  ): Result<void, DomainError> {
    if (paymentMode === PaymentModes.MONTH_END && !customer.allowsMonthlyPayments) {
      return err(
        new DomainError(
          'MONTHLY_PAYMENT_NOT_ALLOWED',
          `El cliente ${customer.fullName} no cuenta con autorización para compras bajo la modalidad de pago mensual recurrente.`
        )
      );
    }

    return ok(undefined);
  }
}
