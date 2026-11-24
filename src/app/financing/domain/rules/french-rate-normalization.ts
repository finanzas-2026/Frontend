import Decimal from 'decimal.js';

export const COMMERCIAL_YEAR_DAYS = 360;
export const COMMERCIAL_MONTH_DAYS = 30;

// High precision configuration for intermediate financial equations
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export interface RateNormalizationInput {
  rateValue: Decimal | string | number;
  rateType: 'NOMINAL' | 'EFFECTIVE';
  compoundingDays?: number;
  ratePeriodDays?: number;
}

export interface NormalizedRatesOutput {
  tea: Decimal;
  ted: Decimal;
  tep30: Decimal;
}

export function normalizeRates(input: RateNormalizationInput): NormalizedRatesOutput {
  const raw = new Decimal(input.rateValue);
  const period = input.ratePeriodDays;
  if (!raw.isFinite() || raw.lt(0) || period === undefined || ![1, 15, 30, 360].includes(period)) {
    throw new Error('Falta el período pactado o la tasa es inválida.');
  }
  const tea = toAnnualRate(raw, period, input);
  // TED = (1 + TEA)^(1/360) - 1
  const onePlusTea = new Decimal(1).plus(tea);
  const ted = onePlusTea.pow(new Decimal(1).dividedBy(COMMERCIAL_YEAR_DAYS)).minus(1);

  // TEP30 = (1 + TEA)^(30/360) - 1
  const tep30 = onePlusTea.pow(new Decimal(COMMERCIAL_MONTH_DAYS).dividedBy(COMMERCIAL_YEAR_DAYS)).minus(1);

  return { tea, ted, tep30 };
}


function toAnnualRate(raw: Decimal, period: number, input: RateNormalizationInput): Decimal {
  if (input.rateType === 'EFFECTIVE' && input.compoundingDays == null) {
    return raw.plus(1).pow(new Decimal(COMMERCIAL_YEAR_DAYS).div(period)).minus(1);
  }
  if (input.rateType !== 'NOMINAL') throw new Error('Tipo o capitalización de tasa inválidos.');
  const days = input.compoundingDays;
  if (days === 7) throw new Error('Capitalización semanal pendiente de acuerdo con Backend.');
  if (days === undefined || ![1, 15, 30, 60, 90, 180, 360].includes(days)) {
    throw new Error('Frecuencia de capitalización inválida.');
  }
  return raw.times(days).div(period).plus(1).pow(new Decimal(COMMERCIAL_YEAR_DAYS).div(days)).minus(1);
}


export function calculateOverdueInterest(principal: string, annualRate: Decimal, days: number): Decimal {
  const exponent = new Decimal(Math.max(days, 0)).div(COMMERCIAL_YEAR_DAYS);
  return new Decimal(principal).times(annualRate.plus(1).pow(exponent).minus(1));
}
