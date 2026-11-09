import Decimal from 'decimal.js';
import { Money, Rate } from '@shared/index';

export class GraceCapitalizationRule {
  /**
   * Art. 1250 C.C.: Total grace capitalization
   * P' = round(P * (1 + TED)^tg, 2)
   */
  static apply(initialCapital: Money, ted: Rate, graceDays: number): Money {
    if (graceDays <= 0) {
      return initialCapital;
    }

    const pDec = initialCapital.toDecimal();
    const onePlusTed = new Decimal(1).plus(ted.toDecimal());
    const capitalized = pDec.times(onePlusTed.pow(graceDays)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return Money.fromDecimal(capitalized, initialCapital.currency);
  }
}
