import { BaseEntity } from '@shared/domain';
import { UserRole } from '../constants/user-roles.constant';
import { UserStatus } from '../enums/user-status.enum';

/**
 * IAM user.
 *
 * `storeId` is null only for platform-wide users (SUPER_ADMIN).
 * `passwordHash` is opaque credential material; plain passwords never reach Domain.
 */
export interface User extends BaseEntity {
  readonly storeId: number | null;
  readonly username: string;
  readonly passwordHash: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly userType: UserRole;
  readonly status: UserStatus;
}
