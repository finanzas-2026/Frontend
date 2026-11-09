import Decimal from 'decimal.js';
import { Money, Rate } from '@shared/domain';

export class OverdueCapitalPenaltyRule {
  static calculate(
    overduePrincipal: Money,
    moratoriumTea: Rate,
    daysOverdue: number
  ): Money {
    if (daysOverdue <= 0 || overduePrincipal.isZero()) {
      return Money.zero();
    }

    // Factor = (1 + TED)^d - 1 = (1 + TEA)^(d/360) - 1
    const teaDecimal = moratoriumTea.toDecimal();
    const one = new Decimal(1);
    const delayExponent = new Decimal(daysOverdue).dividedBy(360);
    const compoundFactor = one.plus(teaDecimal).pow(delayExponent).minus(one);

    // Penalty = OverduePrincipal * compoundFactor
    const penaltyAmount = overduePrincipal.toDecimal().times(compoundFactor);

    return Money.fromDecimal(penaltyAmount);
  }
}
