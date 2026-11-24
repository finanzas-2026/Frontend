export interface CreateSaleDetailRequestDto {
  product_id: number;
  quantity: number;
}

export interface CreateSaleRequestDto {
  customer_id: number;
  payment_mode: 'CASH' | 'MONTH_END' | 'INSTALLMENTS';
  installments_count?: number;
  grace_days?: number;
  tea?: string;
  expected_total: string;
  first_due_date?: string;
  details: CreateSaleDetailRequestDto[];
}
