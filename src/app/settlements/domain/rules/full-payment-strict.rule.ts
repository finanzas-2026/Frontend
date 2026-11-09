import { DomainError, Money, Result, ok, err } from '@shared/domain';

export class FullPaymentStrictRule {
  static validate(
    amountPaid: Money,
    totalPayoffDue: Money
  ): Result<void, DomainError> {
    if (amountPaid.isLessThan(totalPayoffDue)) {
      return err(
        new DomainError(
          'PARTIAL_PAYMENT_REJECTED',
          `La política de cobranza exige la cancelación integral de la liquidación en mora (${totalPayoffDue.toFormatted()}). Se recibió: ${amountPaid.toFormatted()}.`
        )
      );
    }

    return ok(undefined);
  }
}
