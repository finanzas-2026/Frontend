export interface SimulateScheduleRequestDto {
  initial_capital: string;
  rate_value: string;
  rate_type: 'NOMINAL' | 'EFECTIVA';
  compounding_days?: number;
  total_installments: number;
  grace_days?: number;
  first_due_date?: string;
}
