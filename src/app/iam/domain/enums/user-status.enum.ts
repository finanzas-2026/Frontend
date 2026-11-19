/**
 * Native TypeScript enums are forbidden by the project lint rules, so this
 * enumeration uses the same const-object convention as Shared Domain.
 */
export const UserStatuses = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BLOCKED: 'BLOCKED',
} as const;

export type UserStatus = (typeof UserStatuses)[keyof typeof UserStatuses];
