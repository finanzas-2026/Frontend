import { UnitOfMeasure } from '../../domain/enums/unit-of-measure.enum';

const UNIT_LABELS: Record<UnitOfMeasure, string> = {
  UNIDAD: 'Unidad',
  PAR: 'Par',
  DOCENA: 'Docena',
  PAQUETE: 'Paquete',
  CAJA: 'Caja',
  BOLSA: 'Bolsa',
  SACO: 'Saco',
  BOTELLA: 'Botella',
  LATA: 'Lata',
  FRASCO: 'Frasco',
  KILOGRAMO: 'Kilogramo',
  GRAMO: 'Gramo',
  TONELADA: 'Tonelada',
  LITRO: 'Litro',
  MILILITRO: 'Mililitro',
  METRO: 'Metro',
  CENTIMETRO: 'Centímetro',
};

/** Presents a Domain unit of measure with a readable Spanish label. */
export function formatUnit(unit: UnitOfMeasure): string {
  return UNIT_LABELS[unit];
}
