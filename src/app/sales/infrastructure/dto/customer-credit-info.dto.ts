export interface CustomerCreditInfoDto {
  id: number;
  full_name: string;
  document_number: string;
  credit_limit: string;
  current_debt: string;
  allows_monthly_payments: boolean;
  max_credit_months?: number;
  compensatory_rate_type?: 'NOMINAL' | 'EFECTIVA';
  compensatory_rate_value?: string;
  compensatory_rate_period_days?: number;
  compensatory_capitalization_days?: number | null;
}
