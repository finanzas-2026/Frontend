import Decimal from 'decimal.js';
import { Money } from '@shared/domain';
import { ImputationBreakdown } from '../model/imputation-breakdown.vo';

export class LegalImputationOrderRule {
  static impute(
    amountPaid: Money,
    moratoriumDue: Money,
    compensatoryDue: Money,
    principalDue: Money
  ): ImputationBreakdown {
    let available = amountPaid.toDecimal();

    // 1° Imputación: Interés Moratorio y Penalidades
    const moraDue = moratoriumDue.toDecimal();
    const appliedMora = Decimal.min(available, moraDue);
    available = available.minus(appliedMora);

    // 2° Imputación: Interés Compensatorio
    const compDue = compensatoryDue.toDecimal();
    const appliedComp = Decimal.min(available, compDue);
    available = available.minus(appliedComp);

    // 3° Imputación: Capital Adeudado
    const princDue = principalDue.toDecimal();
    const appliedPrinc = Decimal.min(available, princDue);
    available = available.minus(appliedPrinc);

    // 4° Saldo a favor (si el pago excede el total adeudado)
    const creditBalance = available.greaterThan(0) ? available : new Decimal(0);

    // Deuda remanente
    const remainingMora = moraDue.minus(appliedMora);
    const remainingComp = compDue.minus(appliedComp);
    const remainingPrinc = princDue.minus(appliedPrinc);
    const totalRemaining = remainingMora.plus(remainingComp).plus(remainingPrinc);

    return new ImputationBreakdown({
      amountPaid,
      appliedToMoratorium: Money.fromDecimal(appliedMora),
      appliedToCompensatory: Money.fromDecimal(appliedComp),
      appliedToPrincipal: Money.fromDecimal(appliedPrinc),
      creditBalance: Money.fromDecimal(creditBalance),
      remainingDebt: Money.fromDecimal(totalRemaining),
    });
  }
}
