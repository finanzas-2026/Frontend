export interface AuditMovementDto {
  id: number;
  timestamp: string;
  event_type: 'SALE_CREATED' | 'SETTLEMENT_CUTOFF' | 'PAYMENT_RECEIVED';
  customer_name: string;
  amount: string;
  description: string;
  reference_code?: string;
}
