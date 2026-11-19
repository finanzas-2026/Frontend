import { UserRole } from '../../domain/constants/user-roles.constant';

/**
 * Identity and context of the authenticated user.
 *
 * It deliberately excludes credentials, tokens and any HTTP/JSON Server
 * detail, so it remains valid against a real backend later.
 */
export interface AuthSession {
  readonly userId: number;
  readonly username: string;
  readonly userType: UserRole;
  readonly storeId: number | null;
}
