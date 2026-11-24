export const UnitOfMeasures = {
  KG: 'KG',
  LITER: 'LITER',
  UNIT: 'UNIT',
  PACK: 'PACK',
  BAG: 'BAG',
} as const;

export type UnitOfMeasure = (typeof UnitOfMeasures)[keyof typeof UnitOfMeasures];
