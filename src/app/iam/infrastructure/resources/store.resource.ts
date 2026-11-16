import {
  BaseResource,
  BaseResponse,
} from '@shared/infrastructure/base-response';

/**
 * HTTP representation of a persisted store.
 *
 * `db/db.json` stores stores with an `id` primary key (the conceptual ER
 * diagram calls it `store_id`, but the actual JSON payload does not).
 */
export interface StoreResource extends BaseResource {
  readonly business_name: string;
  readonly tax_id: string;
  readonly address: string;
  readonly created_at: string;
  readonly status: string;
}

/**
 * `json-server` returns a bare array for collection endpoints. This interface
 * keeps compatibility with `BaseApiEndpoint`'s `BaseResponse` constraint while
 * describing the actual array payload and an optional wrapped response.
 */
export interface StoreCollectionResponse extends BaseResponse<StoreResource[]> {
  readonly length?: number;
  readonly [index: number]: StoreResource | undefined;
}
