import { BaseResource } from '@shared';

export interface ProductResource extends BaseResource {
  readonly store_id: number;
  readonly name: string;
  readonly description: string | null;
  readonly brand: string | null;
  readonly supplier: string | null;
  readonly unit_of_measure: string;
  readonly image_url: string | null;
  readonly cash_price: number;
  readonly credit_list_price: number;
  readonly allows_installments: boolean;
  readonly current_stock: number;
  readonly min_stock: number;
  readonly status: string;
}

export type ProductWriteRequest = Omit<ProductResource, 'id' | 'store_id'>;
