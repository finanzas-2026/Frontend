export const UserStatuses = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const);

export type UserStatus = (typeof UserStatuses)[keyof typeof UserStatuses];

export function isUserStatus(value: string): value is UserStatus {
  return Object.values(UserStatuses).includes(value as UserStatus);
}
