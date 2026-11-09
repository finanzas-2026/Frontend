import { describe, it, expect } from 'vitest';
import { Money, Rate, RateTypes } from '@shared/index';
import { RateNormalizationRule } from './rate-normalization.rule';
import { GraceCapitalizationRule } from './grace-capitalization.rule';
import { TerminalCentAdjustmentRule } from './terminal-cent-adjustment.rule';

describe('Financing Domain Rules', () => {
  it('RateNormalizationRule: Should normalize TNA to TEA, TED, and TEP30', () => {
    const tna = Rate.fromPercent(24).unwrap();
    const normalized = RateNormalizationRule.apply(tna, RateTypes.NOMINAL, 360);

    expect(normalized.ted.toFractionString()).toBe('0.0006667');
    expect(normalized.tep30.toFractionString()).toBe('0.0201945');
  });

  it('GraceCapitalizationRule: Should capitalize capital for tg > 0 according to Art. 1250 C.C.', () => {
    const P = Money.fromString('1500.00').unwrap();
    const ted = Rate.fromFraction('0.0006667').unwrap();
    const PPrime = GraceCapitalizationRule.apply(P, ted, 15);

    expect(PPrime.toString()).toBe('1515.07');
  });

  it('GraceCapitalizationRule: Should return original capital when tg = 0', () => {
    const P = Money.fromString('1000.00').unwrap();
    const ted = Rate.fromFraction('0.0006667').unwrap();
    const PPrime = GraceCapitalizationRule.apply(P, ted, 0);

    expect(PPrime.toString()).toBe('1000.00');
  });

  it('TerminalCentAdjustmentRule: Should extinguish remaining balance and calculate exact final payment', () => {
    const S2 = Money.fromString('515.24').unwrap();
    const I3 = Money.fromString('10.41').unwrap();

    const { principal, payment, terminalBalance } = TerminalCentAdjustmentRule.apply(S2, I3);

    expect(principal.toString()).toBe('515.24');
    expect(payment.toString()).toBe('525.65');
    expect(terminalBalance.toString()).toBe('0.00');
  });
});
