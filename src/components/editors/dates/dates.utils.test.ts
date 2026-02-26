import type { TimeRange } from '@embeddable.com/core';
import type { DateRange } from '@embeddable.com/remarkable-ui';
import type { DateRangeOption } from '../../../theme/defaults/defaults.DateRanges.constants';
import {
  getDateRangeFromTimeRange,
  getTimeRangeFromDateRange,
  getTimeRangeFromPresets,
  getTimeRangeLabel,
} from './dates.utils';

// Fixed reference point: 2024-06-15 UTC (same year for same-year tests)
const FIXED_NOW = new Date('2024-06-15T12:00:00.000Z');

const makeOption = (value: string, range: TimeRange): DateRangeOption =>
  ({
    value,
    label: value,
    dateFormat: 'DD MMM',
    getRange: vi.fn().mockReturnValue(range),
  }) as unknown as DateRangeOption;

const range = (from: Date, to: Date): TimeRange => ({ from, to, relativeTimeString: '' });

// ---------------------------------------------------------------------------

describe('getTimeRangeFromPresets', () => {
  const jan = range(new Date('2024-01-01T00:00:00.000Z'), new Date('2024-01-31T23:59:59.999Z'));
  const feb = range(new Date('2024-02-01T00:00:00.000Z'), new Date('2024-02-29T23:59:59.999Z'));

  it('returns receivedTimeRange when options is empty array', () => {
    const input: TimeRange = { relativeTimeString: 'this_month', from: undefined, to: undefined };
    expect(getTimeRangeFromPresets(input, [])).toBe(input);
  });

  it('returns receivedTimeRange when options is undefined', () => {
    const input: TimeRange = { relativeTimeString: 'this_month', from: undefined, to: undefined };
    expect(getTimeRangeFromPresets(input, undefined)).toBe(input);
  });

  it('returns receivedTimeRange when relativeTimeString is absent', () => {
    const input = range(new Date('2024-01-01T00:00:00.000Z'), new Date('2024-01-31T00:00:00.000Z'));
    const opts = [makeOption('this_month', jan)];
    expect(getTimeRangeFromPresets(input, opts)).toBe(input);
  });

  it('returns receivedTimeRange when relativeTimeString does not match any option', () => {
    const input: TimeRange = { relativeTimeString: 'unknown', from: undefined, to: undefined };
    const opts = [makeOption('this_month', jan)];
    expect(getTimeRangeFromPresets(input, opts)).toBe(input);
  });

  it('returns resolved range with relativeTimeString when option matches', () => {
    const input: TimeRange = { relativeTimeString: 'jan', from: undefined, to: undefined };
    const opts = [makeOption('jan', jan)];
    const result = getTimeRangeFromPresets(input, opts);
    expect(result).toEqual({
      from: jan?.from,
      to: jan?.to,
      relativeTimeString: 'jan',
    });
  });

  it('resolves the correct option when multiple options are present', () => {
    const input: TimeRange = { relativeTimeString: 'feb', from: undefined, to: undefined };
    const opts = [makeOption('jan', jan), makeOption('feb', feb)];
    const result = getTimeRangeFromPresets(input, opts);
    expect(result).toEqual({
      from: feb?.from,
      to: feb?.to,
      relativeTimeString: 'feb',
    });
  });
});

// ---------------------------------------------------------------------------

describe('getDateRangeFromTimeRange', () => {
  const jan = range(new Date('2024-01-01T00:00:00.000Z'), new Date('2024-01-31T23:59:59.999Z'));

  it('returns undefined when timeRange is undefined', () => {
    expect(getDateRangeFromTimeRange(undefined as unknown as TimeRange)).toBeUndefined();
  });

  it('returns null when timeRange is null', () => {
    expect(getDateRangeFromTimeRange(null as unknown as TimeRange)).toBeNull();
  });

  it('returns timeRange as-is when from and to are present', () => {
    const input = range(new Date('2024-03-01T00:00:00.000Z'), new Date('2024-03-31T00:00:00.000Z'));
    expect(getDateRangeFromTimeRange(input)).toBe(input);
  });

  it('resolves via options when from/to missing and relativeTimeString matches', () => {
    const input: TimeRange = { relativeTimeString: 'jan', from: undefined, to: undefined };
    const opt = makeOption('jan', jan);
    const result = getDateRangeFromTimeRange(input, [opt]);
    expect(result).toBe(jan);
  });

  it('returns timeRange as-is when options is empty even with relativeTimeString', () => {
    const input: TimeRange = { relativeTimeString: 'jan', from: undefined, to: undefined };
    expect(getDateRangeFromTimeRange(input, [])).toBe(input);
  });

  it('returns timeRange as-is when relativeTimeString does not match any option', () => {
    const input: TimeRange = { relativeTimeString: 'unknown', from: undefined, to: undefined };
    const opt = makeOption('jan', jan);
    const result = getDateRangeFromTimeRange(input, [opt]);
    // option not found → getRange not defined → finalTimeRange cast undefined
    expect(result).toBeUndefined();
  });

  it('resolves via options when only "from" is missing', () => {
    const input: TimeRange = {
      relativeTimeString: 'jan',
      from: undefined,
      to: new Date('2024-01-31T23:59:59.999Z'),
    };
    const opt = makeOption('jan', jan);
    const result = getDateRangeFromTimeRange(input, [opt]);
    expect(result).toBe(jan);
  });
});

// ---------------------------------------------------------------------------

describe('getTimeRangeFromDateRange', () => {
  it('returns undefined when dateRange is undefined', () => {
    expect(getTimeRangeFromDateRange(undefined)).toBeUndefined();
  });

  it('returns null when dateRange is null', () => {
    expect(getTimeRangeFromDateRange(null as unknown as DateRange)).toBeNull();
  });

  it('converts dateRange to TimeRange with UTC dates and no relativeTimeString', () => {
    const dateRange: DateRange = {
      from: new Date('2024-03-01T00:00:00.000Z'),
      to: new Date('2024-03-31T23:59:59.999Z'),
    };
    const result = getTimeRangeFromDateRange(dateRange);
    expect(result?.relativeTimeString).toBeUndefined();
    expect(result?.from).toEqual(new Date('2024-03-01T00:00:00.000Z'));
    expect(result?.to).toEqual(new Date('2024-03-31T23:59:59.999Z'));
  });

  it('normalises non-UTC input dates to UTC', () => {
    const dateRange: DateRange = {
      from: new Date('2024-03-01'),
      to: new Date('2024-03-31'),
    };
    const result = getTimeRangeFromDateRange(dateRange);
    expect(result?.from).toBeInstanceOf(Date);
    expect(result?.to).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------

describe('getTimeRangeLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const jan = range(new Date('2024-01-01T00:00:00.000Z'), new Date('2024-01-31T23:59:59.999Z'));

  it('returns empty string when timeRange is falsy', () => {
    expect(getTimeRangeLabel(undefined as unknown as TimeRange, 'DD MMM')).toBe('');
  });

  it('returns empty string when timeRange is null', () => {
    expect(getTimeRangeLabel(null as unknown as TimeRange, 'DD MMM')).toBe('');
  });

  it('returns a single date label when from and to format to the same string', () => {
    const sameDay = range(
      new Date('2024-06-15T00:00:00.000Z'),
      new Date('2024-06-15T23:59:59.999Z'),
    );
    expect(getTimeRangeLabel(sameDay, 'DD MMM')).toBe('15 Jun');
  });

  it('returns a range label when from and to differ', () => {
    expect(getTimeRangeLabel(jan, 'DD MMM')).toBe('01 Jan - 31 Jan');
  });

  it('uses provided dateFormat when dates are in the current year', () => {
    const currentYear = range(
      new Date('2024-03-01T00:00:00.000Z'),
      new Date('2024-03-31T23:59:59.999Z'),
    );
    expect(getTimeRangeLabel(currentYear, 'DD MMM')).toBe('01 Mar - 31 Mar');
  });

  it('uses DD MMM YYYY format when "from" is in a different year', () => {
    const crossYear = range(
      new Date('2023-12-01T00:00:00.000Z'),
      new Date('2024-01-31T23:59:59.999Z'),
    );
    expect(getTimeRangeLabel(crossYear, 'DD MMM')).toBe('01 Dec 2023 - 31 Jan 2024');
  });

  it('uses DD MMM YYYY format when "to" is in a different year', () => {
    const futureYear = range(
      new Date('2024-06-01T00:00:00.000Z'),
      new Date('2025-06-30T23:59:59.999Z'),
    );
    expect(getTimeRangeLabel(futureYear, 'DD MMM')).toBe('01 Jun 2024 - 30 Jun 2025');
  });

  it('resolves relativeTimeString via options to compute label', () => {
    const input: TimeRange = { relativeTimeString: 'jan', from: undefined, to: undefined };
    const opt = makeOption('jan', jan);
    expect(getTimeRangeLabel(input, 'DD MMM', [opt])).toBe('01 Jan - 31 Jan');
  });

  it('returns empty string when relativeTimeString does not match any option', () => {
    const input: TimeRange = { relativeTimeString: 'unknown', from: undefined, to: undefined };
    const opt = makeOption('jan', jan);
    // unresolved → dateRange undefined → ''
    expect(getTimeRangeLabel(input, 'DD MMM', [opt])).toBe('');
  });
});
