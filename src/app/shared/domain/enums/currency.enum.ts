export const Currencies = {
  PEN: 'PEN',
} as const;

export type Currency = (typeof Currencies)[keyof typeof Currencies];
