/**
 * Public registration payload.
 *
 * `user_type` is deliberately excluded: the backend must assign the role for
 * public registrations, preventing a client from self-assigning SUPER_ADMIN.
 * `store_id` is required because a public registration belongs to a tenant.
 */
export interface SignUpRequest {
  readonly username: string;
  readonly password: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string;
  readonly store_id: number;
}
