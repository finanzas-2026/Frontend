import Decimal from 'decimal.js';

export const COMMERCIAL_YEAR_DAYS = 360;
export const COMMERCIAL_MONTH_DAYS = 30;

// High precision configuration for intermediate financial equations
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export interface RateNormalizationInput {
  rateValue: Decimal | string | number;
  rateType: 'NOMINAL' | 'EFECTIVA';
  compoundingDays?: number; // m: e.g. 360 for daily in commercial year, 30 for monthly
}

export interface NormalizedRatesOutput {
  tea: Decimal;
  ted: Decimal;
  tep30: Decimal;
}

/**
 * Normalizes rates to commercial 360/30 base.
 * If TNA: TEA = (1 + TNA/m)^m - 1
 * If TEA: TEA = rateValue
 * TED = (1 + TEA)^(1/360) - 1
 * TEP30 = (1 + TEA)^(30/360) - 1
 */
export function normalizeRates(input: RateNormalizationInput): NormalizedRatesOutput {
  const rawRate = input.rateValue instanceof Decimal
    ? input.rateValue
    : new Decimal(input.rateValue.toString());

  let tea: Decimal;

  if (input.rateType === 'NOMINAL') {
    const m = new Decimal(input.compoundingDays ?? COMMERCIAL_YEAR_DAYS);
    // TEA = (1 + TNA/m)^m - 1
    const factor = new Decimal(1).plus(rawRate.dividedBy(m));
    tea = factor.pow(m).minus(1);
  } else {
    tea = rawRate;
  }

  // TED = (1 + TEA)^(1/360) - 1
  const onePlusTea = new Decimal(1).plus(tea);
  const ted = onePlusTea.pow(new Decimal(1).dividedBy(COMMERCIAL_YEAR_DAYS)).minus(1);

  // TEP30 = (1 + TEA)^(30/360) - 1
  const tep30 = onePlusTea.pow(new Decimal(COMMERCIAL_MONTH_DAYS).dividedBy(COMMERCIAL_YEAR_DAYS)).minus(1);

  return { tea, ted, tep30 };
}
