import { SelectListOptionProps } from '@embeddable.com/remarkable-ui';
import {
  getGranularitySelectFieldOptions,
  getAvailableGranularityOptionsFromTimeRange,
  getSafeSelection,
} from './GranularitySelectField.utils';
import { resolveI18nString } from '../../../component.utils';

vi.mock('../../../component.utils', () => ({ resolveI18nString: vi.fn() }));

const makeOpt = (value: string, label = value): SelectListOptionProps => ({ value, label });

// ---------------------------------------------------------------------------

describe('getGranularitySelectFieldOptions', () => {
  beforeEach(() => {
    vi.mocked(resolveI18nString).mockReset();
  });

  it('returns one entry per default granularity (8 total)', () => {
    vi.mocked(resolveI18nString).mockImplementation((s) => s);
    expect(getGranularitySelectFieldOptions()).toHaveLength(8);
  });

  it('resolves each label through resolveI18nString', () => {
    vi.mocked(resolveI18nString).mockReturnValue('Resolved');
    const result = getGranularitySelectFieldOptions();
    expect(resolveI18nString).toHaveBeenCalledTimes(8);
    expect(result.every((opt) => opt.label === 'Resolved')).toBe(true);
  });

  it('preserves the original option values', () => {
    vi.mocked(resolveI18nString).mockImplementation((s) => s);
    const values = getGranularitySelectFieldOptions().map((o) => o.value);
    expect(values).toEqual(['second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year']);
  });
});

// ---------------------------------------------------------------------------

describe('getAvailableGranularityOptionsFromTimeRange', () => {
  const allOpts = ['second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'].map(
    (value) => makeOpt(value),
  );

  it('returns allOptions unchanged when timeRange is null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getAvailableGranularityOptionsFromTimeRange(null as any, allOpts)).toBe(allOpts);
  });

  it('returns allOptions unchanged when timeRange is undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getAvailableGranularityOptionsFromTimeRange(undefined as any, allOpts)).toBe(allOpts);
  });

  it('returns allOptions when from cannot be parsed (fail-open)', () => {
    const result = getAvailableGranularityOptionsFromTimeRange(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { from: 'not-a-date', to: new Date('2024-01-01') } as any,
      allOpts,
    );
    expect(result).toBe(allOpts);
  });

  it('returns allOptions when to cannot be parsed (fail-open)', () => {
    const result = getAvailableGranularityOptionsFromTimeRange(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { from: new Date('2024-01-01'), to: 'not-a-date' } as any,
      allOpts,
    );
    expect(result).toBe(allOpts);
  });

  it('accepts string timestamps', () => {
    const result = getAvailableGranularityOptionsFromTimeRange(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { from: '2024-01-01T00:00:00Z', to: '2024-01-01T01:00:00Z' } as any,
      allOpts,
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns only minute and hour for a 1-hour range', () => {
    // 1 hour: minute ≈ 60 buckets (valid), hour = 1 bucket (valid),
    //         second ≈ 3600 (> 100 → invalid), day ≈ 0.04 (< 1 → invalid)
    const from = new Date('2024-01-01T00:00:00.000Z');
    const to = new Date('2024-01-01T01:00:00.000Z');
    const opts = [makeOpt('second'), makeOpt('minute'), makeOpt('hour'), makeOpt('day')];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getAvailableGranularityOptionsFromTimeRange({ from, to } as any, opts);
    expect(result.map((o) => o.value)).toEqual(['minute', 'hour']);
  });

  it('preserves original option ordering in the filtered result', () => {
    const from = new Date('2024-01-01T00:00:00.000Z');
    const to = new Date('2024-01-01T01:00:00.000Z');
    // Pass in reverse order – result should mirror that order
    const opts = [makeOpt('hour'), makeOpt('minute')];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getAvailableGranularityOptionsFromTimeRange({ from, to } as any, opts);
    expect(result[0]?.value).toBe('hour');
    expect(result[1]?.value).toBe('minute');
  });

  it('returns empty array when no options fit the range', () => {
    // 10-second range: only 'second' (10 buckets) is valid; 'year' is not
    const from = new Date('2024-01-01T00:00:00.000Z');
    const to = new Date('2024-01-01T00:00:10.000Z');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getAvailableGranularityOptionsFromTimeRange({ from, to } as any, [
      makeOpt('year'),
    ]);
    expect(result).toEqual([]);
  });

  it('excludes options when start equals end (0 effective buckets)', () => {
    const d = new Date('2024-01-01T00:00:00.000Z');
    // same start/end → diff+1ms = 1ms → 0.001 seconds → < 1 bucket for every granularity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getAvailableGranularityOptionsFromTimeRange({ from: d, to: d } as any, [
      makeOpt('second'),
    ]);
    expect(result).toEqual([]);
  });

  it('returns empty array when start is after end', () => {
    const from = new Date('2024-01-02T00:00:00.000Z');
    const to = new Date('2024-01-01T00:00:00.000Z');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getAvailableGranularityOptionsFromTimeRange({ from, to } as any, [
      makeOpt('day'),
    ]);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('getSafeSelection', () => {
  const opts: SelectListOptionProps[] = [makeOpt('day'), makeOpt('week'), makeOpt('month')];

  it('returns undefined when granularity is undefined', () => {
    expect(getSafeSelection(opts, undefined)).toBeUndefined();
  });

  it('returns the granularity when it exists in availableOptions', () => {
    expect(getSafeSelection(opts, 'week')).toBe('week');
  });

  it('returns the second option (index 1) when granularity not found and options.length > 2', () => {
    // opts has 3 entries, so optionToSelect = 1 → 'week'
    expect(getSafeSelection(opts, 'year')).toBe('week');
  });

  it('returns the first option (index 0) when granularity not found and options.length <= 2', () => {
    const twoOpts = [makeOpt('day'), makeOpt('week')];
    expect(getSafeSelection(twoOpts, 'year')).toBe('day');
  });

  it('returns the first option when only one option exists and granularity is not found', () => {
    expect(getSafeSelection([makeOpt('day')], 'year')).toBe('day');
  });

  it('returns undefined when availableOptions is empty and granularity is not found', () => {
    expect(getSafeSelection([], 'day')).toBeUndefined();
  });
});
