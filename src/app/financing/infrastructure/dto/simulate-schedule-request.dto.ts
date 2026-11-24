export interface SimulateScheduleRequestDto {
  initial_capital: string;
  rate_value: string;
  rate_type: 'NOMINAL' | 'EFFECTIVE';
  rate_period_days: number;
  compounding_days?: number;
  customer_id?: number;
  total_installments: number;
  grace_days?: number;
  first_due_date?: string;
}
