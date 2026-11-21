/**
 * Interest rate modality values persisted in `Customers.compensatory_rate_type`
 * and `Customers.penalty_rate_type`.
 *
 * `NOMINAL` requires a capitalization frequency; `EFECTIVA` does not.
 */
export const InterestRateTypes = {
  NOMINAL: 'NOMINAL',
  EFECTIVA: 'EFECTIVA',
} as const;

export type InterestRateType = (typeof InterestRateTypes)[keyof typeof InterestRateTypes];