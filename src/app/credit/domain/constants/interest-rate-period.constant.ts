/**
 * Reference periods / capitalization frequencies expressed in commercial days.
 *
 * These eight periodicities are used both as the reference period and as the
 * nominal capitalization frequency. No conversion algorithms are implemented
 * here.
 */
export const InterestRatePeriods = {
  DIARIA: 1,
  SEMANAL: 7,
  QUINCENAL: 15,
  MENSUAL: 30,
  BIMESTRAL: 60,
  TRIMESTRAL: 90,
  SEMESTRAL: 180,
  ANUAL: 360,
} as const;

export type InterestRatePeriod = (typeof InterestRatePeriods)[keyof typeof InterestRatePeriods];