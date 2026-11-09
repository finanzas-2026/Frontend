import Decimal from 'decimal.js';
import { Result, ok, err } from './result';
import { DomainError } from './domain-error';
import { Currencies, Currency } from '../enums/currency.enum';

export class Money {
  private readonly amount: Decimal;
  readonly currency: Currency;

  private constructor(amount: Decimal, currency: Currency = Currencies.PEN) {
    this.amount = amount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    this.currency = currency;
  }

  static zero(currency: Currency = Currencies.PEN): Money {
    return new Money(new Decimal(0), currency);
  }

  static fromDecimal(amount: Decimal, currency: Currency = Currencies.PEN): Money {
    return new Money(amount, currency);
  }

  static fromString(value: string, currency: Currency = Currencies.PEN): Result<Money, DomainError> {
    if (typeof value !== 'string' || value.trim() === '') {
      return err(new DomainError('INVALID_MONEY_STRING', 'Money string representation cannot be empty'));
    }
    try {
      const parsed = new Decimal(value.trim());
      if (!parsed.isFinite()) {
        return err(new DomainError('INVALID_MONEY_FINITE', 'Money amount must be finite'));
      }
      return ok(new Money(parsed, currency));
    } catch {
      return err(new DomainError('INVALID_MONEY_FORMAT', `Invalid money format: "${value}"`));
    }
  }

  static fromNumber(value: number, currency: Currency = Currencies.PEN): Result<Money, DomainError> {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return err(new DomainError('INVALID_MONEY_NUMBER', 'Money amount must be a finite number'));
    }
    return ok(new Money(new Decimal(value.toString()), currency));
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount.plus(other.amount), this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount.minus(other.amount), this.currency);
  }

  multiply(factor: number | Decimal | string): Money {
    const decFactor = factor instanceof Decimal ? factor : new Decimal(factor.toString());
    return new Money(this.amount.times(decFactor), this.currency);
  }

  compare(other: Money): number {
    this.assertSameCurrency(other);
    return this.amount.comparedTo(other.amount);
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.amount.equals(other.amount);
  }

  isZero(): boolean {
    return this.amount.isZero();
  }

  isPositive(): boolean {
    return this.amount.isPositive() && !this.amount.isZero();
  }

  isNegative(): boolean {
    return this.amount.isNegative();
  }

  isGreaterThan(other: Money): boolean {
    return this.compare(other) > 0;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    return this.compare(other) >= 0;
  }

  isLessThan(other: Money): boolean {
    return this.compare(other) < 0;
  }

  isLessThanOrEqual(other: Money): boolean {
    return this.compare(other) <= 0;
  }

  toDecimal(): Decimal {
    return this.amount;
  }

  toNumber(): number {
    return this.amount.toNumber();
  }

  toString(): string {
    return this.amount.toFixed(2);
  }

  toFormatted(): string {
    const [intPart, decPart] = this.amount.toFixed(2).split('.');
    const formattedInt = (intPart ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `S/ ${formattedInt}.${decPart ?? '00'}`;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new DomainError('CURRENCY_MISMATCH', `Cannot operate on different currencies: ${this.currency} vs ${other.currency}`);
    }
  }
}
