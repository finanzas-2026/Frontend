import {
  BaseResource,
  BaseResponse,
} from '@shared/infrastructure/base-response';

/**
 * HTTP representation of a persisted user.
 *
 * `db/db.json` stores users with an `id` primary key (the conceptual ER
 * diagram calls it `user_id`, but the actual JSON payload does not). `store_id`
 * is the tenant relationship and may be null for platform-wide users.
 *
 * `password_hash` is part of the persisted representation and is required by
 * the IAM domain entity. The backend is expected to redact it on read models
 * exposed to untrusted clients; this adapter keeps the honest wire shape.
 */
export interface UserResource extends BaseResource {
  readonly store_id: number | null;
  readonly username: string;
  readonly password_hash: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string;
  readonly user_type: string;
  readonly status: string;
}

/**
 * `json-server` returns a bare array for collection endpoints. `BaseApiEndpoint`
 * constrains its response generic to `BaseResponse`, so this interface models
 * both the real array payload and the optional wrapped shape without modifying
 * the shared contract.
 */
export interface UserCollectionResponse extends BaseResponse<UserResource[]> {
  readonly length?: number;
  readonly [index: number]: UserResource | undefined;
}
