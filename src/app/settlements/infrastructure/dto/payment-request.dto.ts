export interface PaymentRequestDto {
  amount: string;
  payment_method: 'EFECTIVO' | 'TRANSFERENCIA' | 'YAPE';
  reference_number?: string;
}
