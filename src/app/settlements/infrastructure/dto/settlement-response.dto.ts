export interface SettlementResponseDto {
  id: number;
  code: string;
  customer_id: number;
  customer_name: string;
  cutoff_date: string;
  due_date: string;
  principal_amount: string;
  compensatory_interest: string;
  penalty_amount: string;
  total_due: string;
  status: 'PENDING' | 'OVERDUE' | 'PAID';
  paid_date?: string;
  purchases?: {
    sale_id: number;
    sale_code: string;
    purchase_date: string;
    principal_amount: string;
    compensatory_interest: string;
    total_due: string;
  }[];
}
