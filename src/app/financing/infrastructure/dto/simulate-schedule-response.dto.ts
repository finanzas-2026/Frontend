import { BaseResource } from '@shared/index';

export interface SimulatedInstallmentResource extends BaseResource {
  installment_number: number;
  due_date: string;
  payment_amount: string;
  principal_amount: string;
  interest_amount: string;
  balance_amount: string;
  is_grace_period: boolean;
}

export interface SimulateScheduleResponseDto {
  initial_capital: string;
  capitalized_capital: string;
  grace_days: number;
  total_installments: number;
  tea: string;
  ted: string;
  tep_30: string;
  regular_installment: string;
  total_interest: string;
  total_payment: string;
  installments: SimulatedInstallmentResource[];
}
