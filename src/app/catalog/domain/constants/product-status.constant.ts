export const ProductStatuses = {
  AVAILABLE: 'AVAILABLE',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  DISCONTINUED: 'DISCONTINUED',
} as const;

export type ProductStatus = (typeof ProductStatuses)[keyof typeof ProductStatuses];
