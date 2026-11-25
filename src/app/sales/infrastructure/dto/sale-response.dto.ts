export interface SaleDetailResponseDto {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: string;
  quantity: number;
  subtotal: string;
}

export interface SaleResponseDto {
  id: number;
  code: string;
  customer_id: number;
  customer_name: string;
  store_id: number;
  payment_mode: 'CASH' | 'MONTH_END' | 'INSTALLMENTS';
  total_amount: string;
  month_end_interest?: string;
  first_due_date?: string;
  status: string;
  installments_count?: number;
  grace_days?: number;
  tea?: string;
  issue_date: string;
  details: SaleDetailResponseDto[];
}
