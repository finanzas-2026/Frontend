import Decimal from 'decimal.js';
import { Result, ok, err } from './result';
import { DomainError } from './domain-error';

export class Rate {
  static readonly SIGNIFICANT_DECIMALS = 7;
  private readonly fraction: Decimal;

  private constructor(fraction: Decimal) {
    this.fraction = fraction.toDecimalPlaces(Rate.SIGNIFICANT_DECIMALS, Decimal.ROUND_HALF_UP);
  }

  static fromFraction(val: string | Decimal | number): Result<Rate, DomainError> {
    try {
      const dec = val instanceof Decimal ? val : new Decimal(val.toString().trim());
      if (!dec.isFinite()) {
        return err(new DomainError('INVALID_RATE_FINITE', 'Rate must be finite'));
      }
      if (dec.isNegative()) {
        return err(new DomainError('NEGATIVE_RATE', 'Rate cannot be negative'));
      }
      return ok(new Rate(dec));
    } catch {
      return err(new DomainError('INVALID_RATE_FORMAT', `Invalid rate value: "${val}"`));
    }
  }

  static fromPercent(percentVal: string | Decimal | number): Result<Rate, DomainError> {
    try {
      const cleanStr = typeof percentVal === 'string' ? percentVal.replace('%', '').trim() : percentVal.toString();
      const dec = new Decimal(cleanStr).dividedBy(100);
      return Rate.fromFraction(dec);
    } catch {
      return err(new DomainError('INVALID_PERCENT_RATE', `Invalid percent rate value: "${percentVal}"`));
    }
  }

  toDecimal(): Decimal {
    return this.fraction;
  }

  toNumber(): number {
    return this.fraction.toNumber();
  }

  toFractionString(): string {
    return this.fraction.toFixed(Rate.SIGNIFICANT_DECIMALS);
  }

  toPercentString(): string {
    const percent = this.fraction.times(100);
    return `${percent.toFixed(Rate.SIGNIFICANT_DECIMALS)}%`;
  }

  equals(other: Rate): boolean {
    return this.fraction.equals(other.fraction);
  }
}
