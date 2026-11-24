import { UnitOfMeasure } from '../../domain/enums/unit-of-measure.enum';

const UNIT_LABELS: Record<UnitOfMeasure, string> = {
  KG: 'Kilogramo',
  LITER: 'Litro',
  UNIT: 'Unidad',
  PACK: 'Paquete',
  BAG: 'Saco / bolsa',
};

/** Presents a Domain unit of measure with a readable Spanish label. */
export function formatUnit(unit: UnitOfMeasure): string {
  return UNIT_LABELS[unit];
}
