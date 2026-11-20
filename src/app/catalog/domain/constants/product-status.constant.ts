/**
 * Product lifecycle values persisted in `Products.status`.
 *
 * INACTIVE represents a logical deletion: the product is hidden from the
 * active catalog while its row (and historical sale references) is preserved.
 */
export const ProductStatuses = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type ProductStatus = (typeof ProductStatuses)[keyof typeof ProductStatuses];
