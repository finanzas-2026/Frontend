export interface CreateSaleDetailRequestDto {
  product_id: number;
  quantity: number;
  unit_price: string;
}

export interface CreateSaleRequestDto {
  customer_id: number;
  store_id: number;
  payment_mode: 'CONTADO' | 'FINANCIADO_MENSUAL' | 'FINANCIADO_CUOTAS';
  installments_count?: number;
  grace_days?: number;
  tea?: string;
  details: CreateSaleDetailRequestDto[];
}
