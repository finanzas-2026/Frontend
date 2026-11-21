/* eslint-disable max-lines-per-function -- The amortization loop keeps balances and rounding in chronological order. */
import Decimal from 'decimal.js';
import { normalizeRates, RateNormalizationInput } from './french-rate-normalization';
import { addCommercialMonths, formatDate } from './french-commercial-date';
export interface FrenchSimulationInput {
  initialCapital: number | string | Decimal;
  rateValue: number | string | Decimal;
  rateType: 'NOMINAL' | 'EFECTIVA';
  compoundingDays?: number;
  ratePeriodDays?: number;
  totalInstallments: number; // n
  graceDays?: number; // tg
  firstDueDate?: string; // YYYY-MM-DD
}

export interface SimulatedInstallment {
  installment_number: number;
  due_date: string;
  payment_amount: string; // R
  principal_amount: string; // A
  interest_amount: string; // I
  balance_amount: string; // S
  is_grace_period: boolean;
}

export interface SimulatedScheduleResult {
  initial_capital: string;
  capitalized_capital: string; // P'
  grace_days: number;
  total_installments: number;
  tea: string;
  ted: string;
  tep_30: string;
  regular_installment: string; // R base
  total_interest: string;
  total_payment: string;
  installments: SimulatedInstallment[];
}

function validateScheduleInput(capital: Decimal, installments: number, graceDays: number, date: Date): void {
  const validTerm = Number.isInteger(installments) && installments >= 1 && installments <= 60;
  const validGrace = Number.isInteger(graceDays) && graceDays >= 0 && graceDays <= 360;
  if (!capital.isFinite() || !capital.gt(0) || !validTerm || !validGrace || !Number.isFinite(date.valueOf())) {
    throw new Error('Capital, plazo, fecha o gracia inválidos.');
  }
}

export function calculateFrenchSchedule(input: FrenchSimulationInput): SimulatedScheduleResult {
  const P = new Decimal(input.initialCapital.toString()).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const n = input.totalInstallments;
  const tg = input.graceDays ?? 0;
  const startDate = input.firstDueDate ? new Date(input.firstDueDate) : new Date();
  validateScheduleInput(P, n, tg, startDate);

  const rateInput: RateNormalizationInput = {
    rateValue: input.rateValue,
    rateType: input.rateType,
    compoundingDays: input.compoundingDays,
    ratePeriodDays: input.ratePeriodDays,
  };

  const { tea, ted, tep30 } = normalizeRates(rateInput);

  // Capitalization for full grace period in the academic scenario.
  // P' = P * (1 + TED)^tg
  let PPrime = P;
  if (tg > 0) {
    const onePlusTed = new Decimal(1).plus(ted);
    PPrime = P.times(onePlusTed.pow(tg)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  // Capital Recovery Factor: FRC = [TEP30 * (1 + TEP30)^n] / [(1 + TEP30)^n - 1]
  const onePlusTep = new Decimal(1).plus(tep30);
  const onePlusTepPowN = onePlusTep.pow(n);
  const frc = tep30.isZero() ? new Decimal(1).div(n)
    : tep30.times(onePlusTepPowN).dividedBy(onePlusTepPowN.minus(1));

  // Regular uniform installment: R = round(P' * FRC, 2)
  const regularR = PPrime.times(frc).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const installments: SimulatedInstallment[] = [];
  let currentBalance = PPrime;
  let totalInterestAccum = new Decimal(0);
  let totalPaymentAccum = new Decimal(0);

  // If grace period exists, add row k = 0
  if (tg > 0) {
    const capitalizedInterest = PPrime.minus(P);
    installments.push({
      installment_number: 0,
      due_date: formatDate(addCommercialMonths(startDate, -1)),
      payment_amount: '0.00',
      principal_amount: '0.00',
      interest_amount: capitalizedInterest.toFixed(2),
      balance_amount: PPrime.toFixed(2),
      is_grace_period: true,
    });
    totalInterestAccum = totalInterestAccum.plus(capitalizedInterest);
  }

  // Iterative French amortization
  for (let k = 1; k <= n; k++) {
    const dueDate = addCommercialMonths(startDate, k - 1);

    // Interest: I_k = round(S_{k-1} * TEP30, 2)
    const interestK = currentBalance.times(tep30).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    let principalK: Decimal;
    let paymentK: Decimal;

    if (k === n) {
      // Terminal Cent Adjustment: A_n = S_{n-1}, R_n = A_n + I_n, S_n = 0.00
      principalK = currentBalance;
      paymentK = principalK.plus(interestK);
      currentBalance = new Decimal(0);
    } else {
      // Regular installment: A_k = R - I_k, S_k = S_{k-1} - A_k
      principalK = Decimal.min(currentBalance, Decimal.max(0, regularR.minus(interestK)));
      paymentK = principalK.plus(interestK);
      currentBalance = currentBalance.minus(principalK).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    }

    totalInterestAccum = totalInterestAccum.plus(interestK);
    totalPaymentAccum = totalPaymentAccum.plus(paymentK);

    installments.push({
      installment_number: k,
      due_date: formatDate(dueDate),
      payment_amount: paymentK.toFixed(2),
      principal_amount: principalK.toFixed(2),
      interest_amount: interestK.toFixed(2),
      balance_amount: currentBalance.toFixed(2),
      is_grace_period: false,
    });
  }

  return {
    initial_capital: P.toFixed(2),
    capitalized_capital: PPrime.toFixed(2),
    grace_days: tg,
    total_installments: n,
    tea: tea.toFixed(7),
    ted: ted.toFixed(7),
    tep_30: tep30.toFixed(7),
    regular_installment: regularR.toFixed(2),
    total_interest: totalInterestAccum.toFixed(2),
    total_payment: totalPaymentAccum.toFixed(2),
    installments,
  };
}

export { addCommercialMonths, formatDate } from './french-commercial-date';
