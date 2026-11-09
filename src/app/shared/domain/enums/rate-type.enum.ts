export const RateTypes = {
  NOMINAL: 'NOMINAL',
  EFECTIVA: 'EFECTIVA',
} as const;

export type RateType = (typeof RateTypes)[keyof typeof RateTypes];
