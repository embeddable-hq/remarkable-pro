import { describe, it, expect } from 'vitest';
import { resolveReverseTrendDirection } from './component.utils';

describe('resolveReverseTrendDirection', () => {
  it('mirrors the legacy colors value when the new field is unset (backwards compatibility)', () => {
    expect(resolveReverseTrendDirection(undefined, false)).toBe(false);
    expect(resolveReverseTrendDirection(undefined, true)).toBe(true);
  });

  it('defaults to false when neither value is set', () => {
    expect(resolveReverseTrendDirection(undefined, undefined)).toBe(false);
  });

  it('uses the new field once it has been explicitly configured, independent of the colors value', () => {
    expect(resolveReverseTrendDirection(true, false)).toBe(true);
    expect(resolveReverseTrendDirection(false, true)).toBe(false);
    expect(resolveReverseTrendDirection(true, true)).toBe(true);
    expect(resolveReverseTrendDirection(false, false)).toBe(false);
  });
});
