import { BaseResource } from '@shared';

/**
 * Raw `users` record as returned by JSON Server (`db.json`).
 *
 * Property names mirror the HTTP payload (`snake_case`); the Domain names are
 * applied by `UserAssembler`. The primary key is `id` in `db.json`, even though
 * the ER diagram labels it `user_id`.
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
