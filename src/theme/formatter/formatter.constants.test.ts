import { describe, it, expect, vi, beforeEach } from 'vitest';
import { remarkableThemeFormatter } from './formatter.constants';
import { i18n, i18nSetup } from '../i18n/i18n';
import { isDimension } from '@embeddable.com/core';
import type { Theme } from '../theme.types';
import type { DimensionOrMeasure } from '@embeddable.com/core';

vi.mock('../i18n/i18n', () => ({
  i18n: {
    t: vi.fn((key: string | string[]) => (Array.isArray(key) ? key.at(-1) : key)),
  },
  i18nSetup: vi.fn(),
}));

vi.mock('@embeddable.com/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@embeddable.com/core')>();
  return {
    ...actual,
    isDimension: vi.fn(() => true),
  };
});

const mockTheme = {
  formatter: {
    ...remarkableThemeFormatter,
    locale: 'en-US',
  },
  i18n: { language: 'en', translations: {} },
} as unknown as Theme;

const makeKey = (inputs: Record<string, unknown> = {}, meta?: Record<string, unknown>) =>
  ({
    name: 'testField',
    nativeType: 'string',
    inputs,
    ...(meta ? { meta } : {}),
  }) as unknown as DimensionOrMeasure;

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── remarkableThemeFormatter shape ───────────────────────────────────────────

describe('remarkableThemeFormatter', () => {
  it('uses navigator.language as locale', () => {
    expect(remarkableThemeFormatter.locale).toBe(navigator.language);
  });

  it('has empty default number formatter options', () => {
    expect(remarkableThemeFormatter.defaultNumberFormatterOptions).toEqual({});
  });

  it('has date-time format options with year/month/day/hour/minute/second', () => {
    const opts = remarkableThemeFormatter.defaultDateTimeFormatOptions;
    expect(opts).toMatchObject({
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
  });
});

// ─── stringFormatter ──────────────────────────────────────────────────────────

describe('stringFormatter', () => {
  it('calls i18n.t with the key and returns the result', () => {
    const formatter = remarkableThemeFormatter.stringFormatter();
    // default mock returns the key itself
    expect(formatter.format('greeting')).toBe('greeting');
    expect(i18n.t).toHaveBeenCalledWith('greeting');
  });
});

// ─── numberFormatter ──────────────────────────────────────────────────────────

describe('numberFormatter', () => {
  it('formats a number using the theme locale', () => {
    const formatter = remarkableThemeFormatter.numberFormatter(mockTheme);
    expect(typeof formatter.format(1234.56)).toBe('string');
  });

  it('applies explicit format options', () => {
    const formatter = remarkableThemeFormatter.numberFormatter(mockTheme, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    expect(formatter.format(1234)).toContain('1,234');
  });

  it('formats with a valid currency', () => {
    const formatter = remarkableThemeFormatter.numberFormatter(mockTheme, {
      style: 'currency',
      currency: 'USD',
    });
    const result = formatter.format(42);
    expect(result).toContain('$');
    expect(result).toContain('42');
  });

  it('falls back for an invalid currency code: prepends code and strips currency style', () => {
    const formatter = remarkableThemeFormatter.numberFormatter(mockTheme, {
      style: 'currency',
      currency: 'INVALID',
    });
    const result = formatter.format(42);
    expect(result).toContain('INVALID');
    expect(result).toContain('42');
  });
});

// ─── dataNumberFormatter ──────────────────────────────────────────────────────

describe('dataNumberFormatter', () => {
  it('formats a plain number', () => {
    const formatter = remarkableThemeFormatter.dataNumberFormatter(mockTheme, makeKey());
    expect(typeof formatter.format(100)).toBe('string');
  });

  it('applies currency from key.inputs', () => {
    const formatter = remarkableThemeFormatter.dataNumberFormatter(
      mockTheme,
      makeKey({ currency: 'EUR' }),
    );
    const result = formatter.format(99);
    expect(result).toContain('99');
  });

  it('applies currency from key.meta (legacy)', () => {
    const formatter = remarkableThemeFormatter.dataNumberFormatter(
      mockTheme,
      makeKey({}, { currency: 'GBP' }),
    );
    const result = formatter.format(50);
    expect(result).toContain('50');
  });

  it('applies fixed decimal places from key.inputs', () => {
    const formatter = remarkableThemeFormatter.dataNumberFormatter(
      mockTheme,
      makeKey({ decimalPlaces: 3 }),
    );
    expect(formatter.format(1)).toMatch(/1\.000/);
  });

  it('applies fixed decimal places from key.meta (legacy)', () => {
    const formatter = remarkableThemeFormatter.dataNumberFormatter(
      mockTheme,
      makeKey({}, { decimalPlaces: 2 }),
    );
    expect(formatter.format(7)).toMatch(/7\.00/);
  });

  it('uses compact notation when abbreviateLargeNumber is true', () => {
    const formatter = remarkableThemeFormatter.dataNumberFormatter(
      mockTheme,
      makeKey({ abbreviateLargeNumber: true }),
    );
    expect(formatter.format(1_000_000)).toMatch(/M|million/i);
  });
});

// ─── dateTimeFormatter ────────────────────────────────────────────────────────

describe('dateTimeFormatter', () => {
  it('formats a date with default options', () => {
    const formatter = remarkableThemeFormatter.dateTimeFormatter(mockTheme);
    expect(typeof formatter.format(new Date('2024-06-15'))).toBe('string');
  });

  it('formats a date with year-only options', () => {
    const formatter = remarkableThemeFormatter.dateTimeFormatter(mockTheme, { year: 'numeric' });
    expect(formatter.format(new Date('2024-06-15'))).toContain('2024');
  });

  it('falls back to theme defaults when no options given', () => {
    const formatter = remarkableThemeFormatter.dateTimeFormatter(mockTheme);
    // default options include year, month, day – all should appear in some form
    expect(formatter.format(new Date('2024-06-15'))).toContain('2024');
  });
});

// ─── dataDateTimeFormatter ────────────────────────────────────────────────────

describe('dataDateTimeFormatter', () => {
  const date = new Date('2024-06-15T10:30:45');

  it('calls i18nSetup with the theme', () => {
    remarkableThemeFormatter.dataDateTimeFormatter(mockTheme, makeKey());
    expect(i18nSetup).toHaveBeenCalledWith(mockTheme);
  });

  it('year granularity includes the year', () => {
    const formatter = remarkableThemeFormatter.dataDateTimeFormatter(
      mockTheme,
      makeKey({ granularity: 'year' }),
    );
    expect(formatter.format(date)).toContain('2024');
  });

  it('applies granularity from key.meta when inputs.granularity is absent', () => {
    const formatter = remarkableThemeFormatter.dataDateTimeFormatter(
      mockTheme,
      makeKey({}, { granularity: 'year' }),
    );
    expect(formatter.format(date)).toContain('2024');
  });

  it('quarter granularity calls i18n.t with quarter number and year', () => {
    const formatter = remarkableThemeFormatter.dataDateTimeFormatter(
      mockTheme,
      makeKey({ granularity: 'quarter' }),
    );
    formatter.format(date);
    expect(i18n.t).toHaveBeenCalledWith('granularity.quarter', { quarter: 2, year: 2024 });
  });

  it('month granularity returns a string', () => {
    const formatter = remarkableThemeFormatter.dataDateTimeFormatter(
      mockTheme,
      makeKey({ granularity: 'month' }),
    );
    expect(typeof formatter.format(date)).toBe('string');
  });

  it('week granularity returns a string', () => {
    const formatter = remarkableThemeFormatter.dataDateTimeFormatter(
      mockTheme,
      makeKey({ granularity: 'week' }),
    );
    expect(typeof formatter.format(date)).toBe('string');
  });

  it('day granularity returns a string', () => {
    const formatter = remarkableThemeFormatter.dataDateTimeFormatter(
      mockTheme,
      makeKey({ granularity: 'day' }),
    );
    expect(typeof formatter.format(date)).toBe('string');
  });

  it('hour granularity returns a string', () => {
    const formatter = remarkableThemeFormatter.dataDateTimeFormatter(
      mockTheme,
      makeKey({ granularity: 'hour' }),
    );
    expect(typeof formatter.format(date)).toBe('string');
  });

  it('minute granularity returns a string', () => {
    const formatter = remarkableThemeFormatter.dataDateTimeFormatter(
      mockTheme,
      makeKey({ granularity: 'minute' }),
    );
    expect(typeof formatter.format(date)).toBe('string');
  });

  it('second granularity returns a string', () => {
    const formatter = remarkableThemeFormatter.dataDateTimeFormatter(
      mockTheme,
      makeKey({ granularity: 'second' }),
    );
    expect(typeof formatter.format(date)).toBe('string');
  });

  it('defaults to second (full) format when granularity is absent', () => {
    const formatter = remarkableThemeFormatter.dataDateTimeFormatter(mockTheme, makeKey());
    expect(typeof formatter.format(date)).toBe('string');
  });
});

// ─── dataOthersFormatter ──────────────────────────────────────────────────────

describe('dataOthersFormatter', () => {
  it('calls i18nSetup with the theme', () => {
    remarkableThemeFormatter.dataOthersFormatter(mockTheme, makeKey());
    expect(i18nSetup).toHaveBeenCalledWith(mockTheme);
  });

  it('returns empty string for null value', () => {
    const formatter = remarkableThemeFormatter.dataOthersFormatter(mockTheme, makeKey());
    expect(formatter.format(null as unknown as string)).toBe('');
  });

  it('returns empty string for undefined value', () => {
    const formatter = remarkableThemeFormatter.dataOthersFormatter(mockTheme, makeKey());
    expect(formatter.format(undefined as unknown as string)).toBe('');
  });

  it('calls i18n.t with dimension prefix when isDimension returns true', () => {
    vi.mocked(isDimension).mockReturnValue(true);
    const key = makeKey();
    const formatter = remarkableThemeFormatter.dataOthersFormatter(mockTheme, key);
    formatter.format('Germany');
    expect(i18n.t).toHaveBeenCalledWith(
      ['dimension.testField.Germany', 'dimension.Germany', 'Germany'],
      expect.objectContaining({ value: 'Germany', name: 'testField' }),
    );
  });

  it('calls i18n.t with measure prefix when isDimension returns false', () => {
    vi.mocked(isDimension).mockReturnValue(false);
    const key = makeKey();
    const formatter = remarkableThemeFormatter.dataOthersFormatter(mockTheme, key);
    formatter.format('Revenue');
    expect(i18n.t).toHaveBeenCalledWith(
      ['measure.testField.Revenue', 'measure.Revenue', 'Revenue'],
      expect.objectContaining({ value: 'Revenue', name: 'testField' }),
    );
  });

  it('converts object values via toString before passing to i18n.t', () => {
    const formatter = remarkableThemeFormatter.dataOthersFormatter(mockTheme, makeKey());
    const obj = { toString: () => 'custom' };
    formatter.format(obj as unknown as string);
    expect(i18n.t).toHaveBeenCalledWith(
      expect.arrayContaining(['custom']),
      expect.objectContaining({ value: 'custom' }),
    );
  });
});
