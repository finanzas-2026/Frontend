/**
 * Role values must match the persisted `Users.user_type` values.
 * Keep this object frozen so roles cannot be mutated at runtime.
 */
export const UserRoles = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  STORE_ADMIN: 'STORE_ADMIN',
  CUSTOMER: 'CUSTOMER',
} as const);

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

export function isUserRole(value: string): value is UserRole {
  return Object.values(UserRoles).includes(value as UserRole);
}
