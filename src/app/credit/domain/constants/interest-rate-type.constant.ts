/**
 * Interest rate modality values persisted in `Customers.compensatory_rate_type`
 * and `Customers.penalty_rate_type`.
 *
 * `NOMINAL` requires a capitalization frequency; `EFFECTIVE` does not.
 */
export const InterestRateTypes = {
  NOMINAL: 'NOMINAL',
  EFFECTIVE: 'EFFECTIVE',
} as const;

export type InterestRateType = (typeof InterestRateTypes)[keyof typeof InterestRateTypes];
