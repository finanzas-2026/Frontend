export const PaymentModes = {
  CONTADO: 'CONTADO',
  FINANCIADO_MENSUAL: 'FINANCIADO_MENSUAL',
  FINANCIADO_CUOTAS: 'FINANCIADO_CUOTAS',
} as const;

export type PaymentMode = (typeof PaymentModes)[keyof typeof PaymentModes];
