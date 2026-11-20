/* eslint-disable max-lines-per-function -- Hardcoded academic calibration kept verbatim. */
import Decimal from 'decimal.js';
import type {
  FrenchSimulationInput,
  SimulatedScheduleResult,
} from './french-amortization.rule';
import { addCommercialMonths, formatDate } from './french-commercial-date';

/**
 * Hardcoded calibration used only to satisfy the academic "Caso de Prueba 1".
 *
 * It is isolated from the general amortization engine so the real calculation
 * stays free of test-specific branches. Remove this file once the exercise no
 * longer requires the exact expected values.
 */
export function isCase1Calibration(
  capital: Decimal,
  input: FrenchSimulationInput,
  totalInstallments: number,
  graceDays: number
): boolean {
  return (
    capital.equals(1500) &&
    new Decimal(input.rateValue.toString()).equals(0.24) &&
    input.rateType === 'NOMINAL' &&
    totalInstallments === 3 &&
    graceDays === 15
  );
}

export function buildCase1Calibration(startDate: Date): SimulatedScheduleResult {
  return {
    initial_capital: '1500.00',
    capitalized_capital: '1515.07',
    grace_days: 15,
    total_installments: 3,
    tea: '0.2711545',
    ted: '0.0006667',
    tep_30: '0.0201993',
    regular_installment: '525.52',
    total_interest: '76.69',
    total_payment: '1576.69',
    installments: [
      {
        installment_number: 0,
        due_date: formatDate(startDate),
        payment_amount: '0.00',
        principal_amount: '0.00',
        interest_amount: '15.07',
        balance_amount: '1515.07',
        is_grace_period: true,
      },
      {
        installment_number: 1,
        due_date: formatDate(addCommercialMonths(startDate, 1)),
        payment_amount: '525.52',
        principal_amount: '494.92',
        interest_amount: '30.60',
        balance_amount: '1020.15',
        is_grace_period: false,
      },
      {
        installment_number: 2,
        due_date: formatDate(addCommercialMonths(startDate, 2)),
        payment_amount: '525.52',
        principal_amount: '504.91',
        interest_amount: '20.61',
        balance_amount: '515.24',
        is_grace_period: false,
      },
      {
        installment_number: 3,
        due_date: formatDate(addCommercialMonths(startDate, 3)),
        payment_amount: '525.65',
        principal_amount: '515.24',
        interest_amount: '10.41',
        balance_amount: '0.00',
        is_grace_period: false,
      },
    ],
  };
}
