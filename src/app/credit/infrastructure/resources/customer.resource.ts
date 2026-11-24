import { BaseResource } from '@shared';
import { CreditCurrency } from '../../domain/constants/credit-currency.constant';
import { InterestRatePeriod } from '../../domain/constants/interest-rate-period.constant';
import { InterestRateType } from '../../domain/constants/interest-rate-type.constant';

export interface CustomerResource extends BaseResource {
  readonly full_name?: string;
  readonly store_id: number;
  readonly user_id: number;
  readonly home_address: string;
  readonly phone_number: string;
  readonly credit_limit: number | string;
  readonly max_credit_months: number;
  readonly cutoff_day: number;
  readonly payment_due_day: number;
  readonly compensatory_rate_type: InterestRateType;
  readonly compensatory_rate_period_days: InterestRatePeriod;
  readonly compensatory_capitalization_days: InterestRatePeriod | null;
  readonly compensatory_rate_value: number | string;
  readonly penalty_rate_type: InterestRateType;
  readonly penalty_rate_period_days: InterestRatePeriod;
  readonly penalty_capitalization_days: InterestRatePeriod | null;
  readonly penalty_rate_value: number | string;
  readonly credit_currency: CreditCurrency;
  readonly favour_balance: number | string;
}

export interface CustomerAccountRequest {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
}

export type CustomerCreateRequest = Omit<
  CustomerResource,
  'id' | 'store_id' | 'user_id' | 'favour_balance' | 'full_name'
> & CustomerAccountRequest;

/**
 * Payload used to update an existing customer profile.
 */
export type CustomerUpdateRequest = Omit<
  CustomerResource,
  'id' | 'store_id' | 'user_id' | 'favour_balance' | 'full_name'
>;
