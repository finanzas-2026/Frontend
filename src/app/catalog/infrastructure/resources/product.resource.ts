import { BaseResource } from '@shared';

/**
 * Raw `products` record as returned by JSON Server (`db.json`).
 *
 * Property names mirror the HTTP payload (`snake_case`); the Domain names are
 * applied by `ProductAssembler`. The primary key is `id` in `db.json`, even
 * though the ER diagram labels it `product_id`.
 */
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
  readonly allows_monthly_payments: boolean;
  readonly current_stock: number;
  readonly min_stock: number;
  readonly status: string;
}
