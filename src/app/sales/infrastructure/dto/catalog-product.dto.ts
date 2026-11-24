export interface CatalogProductDto {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: string;
  credit_unit_price?: string;
  allows_installments: boolean;
  stock: number;
}
