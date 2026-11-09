import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Money } from './money.vo';
import { Currencies } from '../enums/currency.enum';

describe('Money Value Object', () => {
  it('should create Money from valid string and format to 2 decimal places', () => {
    const res = Money.fromString('1500.5');
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.toString()).toBe('1500.50');
      expect(res.value.toFormatted()).toBe('S/ 1,500.50');
    }
  });

  it('should handle zero, positive and negative correctly', () => {
    const zero = Money.zero();
    expect(zero.isZero()).toBe(true);
    expect(zero.isPositive()).toBe(false);

    const pos = Money.fromString('10.00').unwrap();
    expect(pos.isPositive()).toBe(true);
    expect(pos.isZero()).toBe(false);

    const neg = Money.fromString('-5.00').unwrap();
    expect(neg.isNegative()).toBe(true);
  });

  it('should add, subtract and multiply accurately without floating-point errors', () => {
    const m1 = Money.fromString('0.10').unwrap();
    const m2 = Money.fromString('0.20').unwrap();
    const sum = m1.add(m2);

    expect(sum.toString()).toBe('0.30');
    expect(sum.equals(Money.fromString('0.30').unwrap())).toBe(true);

    const diff = sum.subtract(m1);
    expect(diff.toString()).toBe('0.20');

    const mult = m1.multiply('3');
    expect(mult.toString()).toBe('0.30');
  });

  it('should support fromDecimal, fromNumber, toNumber, toDecimal and equals', () => {
    const fromNum = Money.fromNumber(25.5).unwrap();
    expect(fromNum.toNumber()).toBe(25.5);
    expect(fromNum.toDecimal().toNumber()).toBe(25.5);

    const fromDec = Money.fromDecimal(fromNum.toDecimal());
    expect(fromDec.equals(fromNum)).toBe(true);
  });

  it('should compare money amounts correctly', () => {
    const a = Money.fromString('100.00').unwrap();
    const b = Money.fromString('200.00').unwrap();
    const c = Money.fromString('100.00').unwrap();

    expect(a.compare(b)).toBe(-1);
    expect(b.compare(a)).toBe(1);
    expect(a.compare(c)).toBe(0);
    expect(a.isLessThan(b)).toBe(true);
    expect(b.isGreaterThan(a)).toBe(true);
    expect(a.isLessThanOrEqual(c)).toBe(true);
    expect(a.isGreaterThanOrEqual(c)).toBe(true);
  });

  it('should throw when operating with different currencies', () => {
    const pen = Money.fromString('100.00', Currencies.PEN).unwrap();
    // simulate mismatched currency with typing
    const other = Money.fromString('100.00', 'USD' as typeof Currencies.PEN).unwrap();
    expect(() => pen.add(other)).toThrow();
  });

  it('should fail with error when creating from invalid strings or numbers', () => {
    expect(Money.fromString('').isErr()).toBe(true);
    expect(Money.fromString('abc').isErr()).toBe(true);
    expect(Money.fromNumber(NaN).isErr()).toBe(true);
    expect(Money.fromNumber(Infinity).isErr()).toBe(true);
  });

  // F1-2: Fast-check property test
  it('F1-2: Sum of arbitrary lists of money amounts in random order is strictly commutative', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.float({ min: 0, max: 100000, noNaN: true }).filter((n) => isFinite(n)),
          { minLength: 2, maxLength: 20 }
        ),
        (numbers) => {
          const moneyList = numbers.map((n) => Money.fromString(n.toFixed(2)).unwrap());

          const sumInOrder = moneyList.reduce((acc, m) => acc.add(m), Money.zero());

          const reversed = [...moneyList].reverse();
          const sumReversed = reversed.reduce((acc, m) => acc.add(m), Money.zero());

          expect(sumInOrder.toString()).toBe(sumReversed.toString());
        }
      ),
      { numRuns: 100 }
    );
  });
});
