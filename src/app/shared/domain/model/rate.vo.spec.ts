import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Rate } from './rate.vo';

describe('Rate Value Object', () => {
  it('should create Rate from valid fraction and output 7 decimals', () => {
    const res = Rate.fromFraction('0.24');
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.toFractionString()).toBe('0.2400000');
      expect(res.value.toPercentString()).toBe('24.0000000%');
    }
  });

  it('should reject negative rates or invalid inputs', () => {
    expect(Rate.fromFraction('-0.10').isErr()).toBe(true);
    expect(Rate.fromFraction('invalid').isErr()).toBe(true);
    expect(Rate.fromFraction(Infinity).isErr()).toBe(true);
    expect(Rate.fromPercent('invalid%').isErr()).toBe(true);
  });

  it('should support toNumber, toDecimal, and equals', () => {
    const r1 = Rate.fromFraction('0.1500000').unwrap();
    const r2 = Rate.fromFraction('0.1500000').unwrap();
    const r3 = Rate.fromFraction('0.2000000').unwrap();

    expect(r1.toNumber()).toBe(0.15);
    expect(r1.toDecimal().toNumber()).toBe(0.15);
    expect(r1.equals(r2)).toBe(true);
    expect(r1.equals(r3)).toBe(false);
  });

  // F1-3: Round-trip conversion without precision loss
  it('F1-3: Round-trip conversion between fraction and percent string preserves exact precision', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.0000001, max: 100, noNaN: true }).filter((n) => isFinite(n)),
        (num) => {
          const originalStr = num.toFixed(7);
          const rate1 = Rate.fromFraction(originalStr).unwrap();
          const percentStr = rate1.toPercentString();

          const rate2 = Rate.fromPercent(percentStr).unwrap();
          expect(rate2.toFractionString()).toBe(rate1.toFractionString());
        }
      ),
      { numRuns: 100 }
    );
  });
});
