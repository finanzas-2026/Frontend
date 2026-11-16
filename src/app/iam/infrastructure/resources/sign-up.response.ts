import { UserRole } from '../../domain/constants/user-roles.constant';
import { UserStatus } from '../../domain/enums/user-status.enum';

/**
 * Provisional registration response.
 *
 * No registration endpoint exists in the current fake backend, so the body
 * could not be verified. It intentionally excludes `password_hash` and any
 * session token: registering a user must not be assumed to start a session.
 * The shape must be re-verified against the real endpoint.
 */
export interface SignUpResponse {
  readonly id: number;
  readonly store_id: number | null;
  readonly username: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string;
  readonly user_type: UserRole;
  readonly status: UserStatus;
}
