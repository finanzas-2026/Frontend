import Decimal from 'decimal.js';
import { Rate, RateType } from '@shared/index';
import { NormalizedRates } from '../model/normalized-rates.vo';

export class RateNormalizationRule {
  private static readonly COMMERCIAL_YEAR_DAYS = 360;
  private static readonly COMMERCIAL_MONTH_DAYS = 30;

  static apply(rate: Rate, rateType: RateType, compoundingDays = 360): NormalizedRates {
    const rawRate = rate.toDecimal();
    let teaDec: Decimal;

    if (rateType === 'NOMINAL') {
      const m = new Decimal(compoundingDays);
      const factor = new Decimal(1).plus(rawRate.dividedBy(m));
      teaDec = factor.pow(m).minus(1);
    } else {
      teaDec = rawRate;
    }

    const onePlusTea = new Decimal(1).plus(teaDec);
    const tedDec = onePlusTea.pow(new Decimal(1).dividedBy(RateNormalizationRule.COMMERCIAL_YEAR_DAYS)).minus(1);
    const tep30Dec = onePlusTea.pow(new Decimal(RateNormalizationRule.COMMERCIAL_MONTH_DAYS).dividedBy(RateNormalizationRule.COMMERCIAL_YEAR_DAYS)).minus(1);

    const tea = Rate.fromFraction(teaDec).unwrap();
    const ted = Rate.fromFraction(tedDec).unwrap();
    const tep30 = Rate.fromFraction(tep30Dec).unwrap();

    return new NormalizedRates(tea, ted, tep30);
  }
}
