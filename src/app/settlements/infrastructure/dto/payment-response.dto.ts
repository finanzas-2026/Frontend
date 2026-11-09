export interface PaymentResponseDto {
  id: number;
  code: string;
  settlement_id: number;
  customer_id: number;
  amount: string;
  payment_date: string;
  payment_method: 'EFECTIVO' | 'TRANSFERENCIA' | 'YAPE';
  reference_number?: string;
  receipt_number: string;
}
