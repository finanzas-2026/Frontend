export interface CustomerCreditInfoDto {
  id: number;
  full_name: string;
  document_number: string;
  credit_limit: string;
  current_debt: string;
  allows_monthly_payments: boolean;
}
