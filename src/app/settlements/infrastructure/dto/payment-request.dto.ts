export interface PaymentRequestDto {
  amount: string;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'YAPE';
  reference_number?: string;
}
