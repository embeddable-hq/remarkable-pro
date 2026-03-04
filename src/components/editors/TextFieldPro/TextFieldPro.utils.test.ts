import { describe, it, expect } from 'vitest';
import { Value } from '@embeddable.com/core';
import { getTextFieldProOnChangeValue } from './TextFieldPro.utils';

describe('getTextFieldProOnChangeValue', () => {
  it('returns noFilter for empty string', () => {
    expect(getTextFieldProOnChangeValue('')).toStrictEqual(Value.noFilter());
  });

  it('returns noFilter for null', () => {
    expect(getTextFieldProOnChangeValue(null)).toStrictEqual(Value.noFilter());
  });

  it('returns noFilter for undefined', () => {
    expect(getTextFieldProOnChangeValue(undefined)).toStrictEqual(Value.noFilter());
  });

  it('returns the value for non-empty string', () => {
    expect(getTextFieldProOnChangeValue('hello')).toBe('hello');
    expect(getTextFieldProOnChangeValue('search term')).toBe('search term');
  });
});
