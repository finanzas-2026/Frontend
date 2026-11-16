export const StoreStatuses = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const);

export type StoreStatus = (typeof StoreStatuses)[keyof typeof StoreStatuses];

export function isStoreStatus(value: string): value is StoreStatus {
  return Object.values(StoreStatuses).includes(value as StoreStatus);
}
