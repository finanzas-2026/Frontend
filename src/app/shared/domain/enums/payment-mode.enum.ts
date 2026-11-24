export const PaymentModes = {
  CASH: 'CASH',
  MONTH_END: 'MONTH_END',
  INSTALLMENTS: 'INSTALLMENTS',
} as const;

export type PaymentMode = (typeof PaymentModes)[keyof typeof PaymentModes];
