/**
 * Currencies supported for credit accounts.
 *
 * The system default currency is `PEN`. No currency conversion or exchange
 * rates are implemented here.
 */
export const CreditCurrencies = {
  PEN: 'PEN',
  USD: 'USD',
  EUR: 'EUR',
} as const;

export type CreditCurrency = (typeof CreditCurrencies)[keyof typeof CreditCurrencies];