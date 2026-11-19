/**
 * Native TypeScript enums are forbidden by the project lint rules, so this
 * enumeration uses the same const-object convention as Shared Domain.
 */
export const StoreStatuses = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type StoreStatus = (typeof StoreStatuses)[keyof typeof StoreStatuses];
