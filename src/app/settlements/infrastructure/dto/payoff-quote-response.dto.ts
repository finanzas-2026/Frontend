export interface PayoffQuoteResponseDto {
  settlement_id: number;
  calculation_date: string;
  days_overdue: number;
  overdue_principal: string;
  compensatory_interest: string;
  moratorium_interest: string;
  total_payoff_amount: string;
}
