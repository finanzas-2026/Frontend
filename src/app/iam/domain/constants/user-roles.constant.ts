/**
 * Role values must match the persisted `Users.user_type` values.
 */
export const UserRoles = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  STORE_ADMIN: 'STORE_ADMIN',
  CUSTOMER: 'CUSTOMER',
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];
