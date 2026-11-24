export interface PaymentResponseDto {
  id: number;
  code: string;
  settlement_id: number;
  customer_id: number;
  amount: string;
  payment_date: string;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'YAPE';
  reference_number?: string;
  receipt_number: string;
  received_amount: string;
  favour_balance: string;
  allocated_to_penalty: string;
  allocated_to_interest: string;
  allocated_to_principal: string;
}
