import { describe, it, expect } from 'vitest';
import { ok, err } from './result';
import { DomainError } from './domain-error';

describe('Result monad', () => {
  it('should create Ok and map value', () => {
    const res = ok(42);
    expect(res.isOk()).toBe(true);
    expect(res.isErr()).toBe(false);
    expect(res.unwrap()).toBe(42);
    expect(res.unwrapOr(0)).toBe(42);

    const mapped = res.map((x) => x * 2);
    expect(mapped.unwrap()).toBe(84);

    const mappedErr = res.mapErr((e) => String(e));
    expect(mappedErr.unwrap()).toBe(42);
  });

  it('should create Err and map error', () => {
    const error = new DomainError('TEST_CODE', 'Test error message');
    const res = err<number, DomainError>(error);

    expect(res.isOk()).toBe(false);
    expect(res.isErr()).toBe(true);
    expect(res.unwrapOr(99)).toBe(99);
    expect(() => res.unwrap()).toThrow('Test error message');

    const mappedErr = res.mapErr((e) => e.code);
    if (mappedErr.isErr()) {
      expect(mappedErr.error).toBe('TEST_CODE');
    }
  });
});
