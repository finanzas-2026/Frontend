export const RateTypes = {
  NOMINAL: 'NOMINAL',
  EFFECTIVE: 'EFFECTIVE',
} as const;

export type RateType = (typeof RateTypes)[keyof typeof RateTypes];
