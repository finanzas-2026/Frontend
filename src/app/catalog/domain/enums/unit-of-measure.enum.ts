/**
 * Commercial units used to count product stock.
 *
 * Only the values currently present in `db.json` (`SACO` and `CAJA`) are
 * defined. The business may use further units; this list can be extended when
 * a complete catalog of units is established.
 */
export const UnitOfMeasures = {
  UNIDAD: 'UNIDAD',
  PAR: 'PAR',
  DOCENA: 'DOCENA',

  PAQUETE: 'PAQUETE',
  CAJA: 'CAJA',
  BOLSA: 'BOLSA',
  SACO: 'SACO',
  BOTELLA: 'BOTELLA',
  LATA: 'LATA',
  FRASCO: 'FRASCO',

  KILOGRAMO: 'KILOGRAMO',
  GRAMO: 'GRAMO',
  TONELADA: 'TONELADA',

  LITRO: 'LITRO',
  MILILITRO: 'MILILITRO',

  METRO: 'METRO',
  CENTIMETRO: 'CENTIMETRO',
} as const;

export type UnitOfMeasure = (typeof UnitOfMeasures)[keyof typeof UnitOfMeasures];
