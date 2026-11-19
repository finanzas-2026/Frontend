import { BaseResource } from '@shared';

/**
 * Raw `stores` record as returned by JSON Server (`db.json`).
 *
 * Property names mirror the HTTP payload (`snake_case`); the Domain names are
 * applied by `StoreAssembler`. The primary key is `id` in `db.json`, even though
 * the ER diagram labels it `store_id`.
 */
export interface StoreResource extends BaseResource {
  readonly business_name: string;
  readonly tax_id: string;
  readonly address: string;
  readonly created_at: string;
  readonly status: string;
}
