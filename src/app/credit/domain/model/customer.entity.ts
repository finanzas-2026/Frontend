import { BaseEntity } from '@shared/domain';
import { InterestRateType } from '../constants/interest-rate-type.constant';
import { InterestRatePeriod } from '../constants/interest-rate-period.constant';
import { CreditCurrency } from '../constants/credit-currency.constant';

/**
 * Credit profile linked to a store and a user.
 *
 * `storeId` and `userId` are primitive references to BC 01; Domain does not
 * depend on the IAM `Store` or `User` entities.
 *
 * Numeric/financial constraints (non-negative credit limit, rates and balance;
 * `maxCreditMonths` between 1 and 36; `cutoffDay`/`paymentDueDay` between 1
 * and 30; mandatory capitalization for `NOMINAL` rates and `null` for
 * `EFECTIVA` rates) belong to the credit contract and are enforced by the
 * upper layers. No calculated fields such as available credit, pending debt,
 * installments or accrued interest are stored here.
 */
export interface Customer extends BaseEntity {
  readonly storeId: number;
  readonly userId: number;
  readonly homeAddress: string;
  readonly phoneNumber: string;
  readonly creditLimit: number;
  readonly maxCreditMonths: number;
  readonly cutoffDay: number;
  readonly paymentDueDay: number;
  readonly compensatoryRateType: InterestRateType;
  readonly compensatoryRatePeriodDays: InterestRatePeriod;
  readonly compensatoryCapitalizationDays: InterestRatePeriod | null;
  readonly compensatoryRateValue: number;
  readonly penaltyRateType: InterestRateType;
  readonly penaltyRatePeriodDays: InterestRatePeriod;
  readonly penaltyCapitalizationDays: InterestRatePeriod | null;
  readonly penaltyRateValue: number;
  readonly creditCurrency: CreditCurrency;
  readonly favourBalance: number;
}