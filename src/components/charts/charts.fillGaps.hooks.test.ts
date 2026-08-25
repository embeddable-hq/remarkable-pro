import { renderHook } from '@testing-library/react';
import type { DataResponse, Dimension, TimeRange } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import { useFillGaps } from './charts.fillGaps.hooks';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(),
}));

type ThemeOverrides = {
  timezone?: string;
  dateRangesOptions?: { value: string; getRange: (tz?: string) => TimeRange }[];
};

const mockTheme = ({ timezone, dateRangesOptions = [] }: ThemeOverrides = {}) => {
  vi.mocked(useTheme).mockReturnValue({
    defaults: { dateRangesOptions },
    clientContext: { timezone },
  } as never);
};

const makeDimension = (overrides: Record<string, unknown> = {}): Dimension =>
  ({
    name: 'date',
    nativeType: 'time',
    inputs: { granularity: 'day' },
    ...overrides,
  }) as unknown as Dimension;

const makeResults = (
  data: Record<string, unknown>[] | undefined,
  isLoading = false,
): DataResponse => ({ data, isLoading, error: undefined }) as unknown as DataResponse;

const makeTimeRange = (from: Date, to: Date): TimeRange => ({
  from,
  to,
  relativeTimeString: undefined,
});

describe('useFillGaps', () => {
  beforeEach(() => {
    mockTheme();
  });

  describe('guard clauses (pass-through, no gap-filling)', () => {
    it('returns results unchanged when granularity is missing', () => {
      const results = makeResults([{ date: '2024-01-01T00:00:00.000Z' }]);
      const dimension = makeDimension({ inputs: {} });

      const { result } = renderHook(() => useFillGaps({ results, dimension }));

      expect(result.current).toBe(results);
    });

    it('returns results unchanged when granularity is unknown', () => {
      const results = makeResults([{ date: '2024-01-01T00:00:00.000Z' }]);
      const dimension = makeDimension({ inputs: { granularity: 'fortnight' } });

      const { result } = renderHook(() => useFillGaps({ results, dimension }));

      expect(result.current).toBe(results);
    });

    it('returns results unchanged when the dimension has no name', () => {
      const results = makeResults([{ date: '2024-01-01T00:00:00.000Z' }]);
      const dimension = makeDimension({ name: undefined });

      const { result } = renderHook(() => useFillGaps({ results, dimension }));

      expect(result.current).toBe(results);
    });

    it('returns results unchanged when results is undefined', () => {
      const dimension = makeDimension();

      const { result } = renderHook(() => useFillGaps({ results: undefined, dimension }));

      expect(result.current).toBeUndefined();
    });

    it('returns results unchanged while still loading', () => {
      const results = makeResults(undefined, true);
      const dimension = makeDimension();

      const { result } = renderHook(() => useFillGaps({ results, dimension }));

      expect(result.current).toBe(results);
    });

    it('returns results unchanged when data is empty', () => {
      const results = makeResults([]);
      const dimension = makeDimension();

      const { result } = renderHook(() => useFillGaps({ results, dimension }));

      expect(result.current).toBe(results);
    });

    it('returns results unchanged when the dimension is not a time dimension', () => {
      const results = makeResults([{ date: '2024-01-01T00:00:00.000Z' }]);
      const dimension = makeDimension({ nativeType: 'string' });

      const { result } = renderHook(() => useFillGaps({ results, dimension }));

      expect(result.current).toBe(results);
    });

    it('returns empty data when bounds cannot be resolved', () => {
      const results = makeResults([{ date: null }]);
      const dimension = makeDimension();

      const { result } = renderHook(() => useFillGaps({ results, dimension }));

      expect(result.current.data).toEqual([]);
    });
  });

  describe('core gap-filling (day granularity, no dateBounds)', () => {
    it('fills a missing day between two data points', () => {
      const results = makeResults([
        { date: '2024-01-01T00:00:00.000Z', value: 1 },
        { date: '2024-01-03T00:00:00.000Z', value: 3 },
      ]);
      const dimension = makeDimension();

      const { result } = renderHook(() => useFillGaps({ results, dimension }));

      expect(result.current.data).toEqual([
        { date: '2024-01-01T00:00:00.000Z', value: 1 },
        { date: '2024-01-02T00:00:00.000' },
        { date: '2024-01-03T00:00:00.000Z', value: 3 },
      ]);
    });

    it('omits gap placeholders when ignoreEmptyDate is set', () => {
      const results = makeResults([
        { date: '2024-01-01T00:00:00.000Z', value: 1 },
        { date: '2024-01-03T00:00:00.000Z', value: 3 },
      ]);
      const dimension = makeDimension({ inputs: { granularity: 'day', ignoreEmptyDate: true } });

      const { result } = renderHook(() => useFillGaps({ results, dimension }));

      expect(result.current.data).toEqual([
        { date: '2024-01-01T00:00:00.000Z', value: 1 },
        { date: '2024-01-03T00:00:00.000Z', value: 3 },
      ]);
    });

    it('sorts records with a null dimension value to the end and drops it from output', () => {
      const results = makeResults([
        { date: '2024-01-01T00:00:00.000Z', value: 1 },
        { date: null, value: 99 },
        { date: '2024-01-02T00:00:00.000Z', value: 2 },
      ]);
      const dimension = makeDimension();

      const { result } = renderHook(() => useFillGaps({ results, dimension }));

      expect(result.current.data).toEqual([
        { date: '2024-01-01T00:00:00.000Z', value: 1 },
        { date: '2024-01-02T00:00:00.000Z', value: 2 },
      ]);
    });

    it('reverses the filled series when orderDirection is desc', () => {
      const results = makeResults([
        { date: '2024-01-01T00:00:00.000Z', value: 1 },
        { date: '2024-01-02T00:00:00.000Z', value: 2 },
      ]);
      const dimension = makeDimension();

      const { result } = renderHook(() =>
        useFillGaps({ results, dimension, orderDirection: 'desc' }),
      );

      expect(result.current.data).toEqual([
        { date: '2024-01-02T00:00:00.000Z', value: 2 },
        { date: '2024-01-01T00:00:00.000Z', value: 1 },
      ]);
    });
  });

  describe('relativeTimeString dateBounds', () => {
    it('resolves bounds via the matching dateRangesOptions entry, passing the client timezone', () => {
      const getRange = vi.fn().mockReturnValue({
        from: new Date('2024-01-01T00:00:00.000Z'),
        to: new Date('2024-01-03T23:59:59.999Z'),
      });
      mockTheme({
        timezone: 'America/Los_Angeles',
        dateRangesOptions: [{ value: 'last_3_days', getRange }],
      });

      const results = makeResults([{ date: '2024-01-02T00:00:00.000Z', value: 2 }]);
      const dimension = makeDimension({
        inputs: { granularity: 'day', dateBounds: { relativeTimeString: 'last_3_days' } },
      });

      const { result } = renderHook(() => useFillGaps({ results, dimension }));

      expect(getRange).toHaveBeenCalledWith('America/Los_Angeles');
      expect(result.current.data).toEqual([
        { date: '2024-01-01T00:00:00.000' },
        { date: '2024-01-02T00:00:00.000Z', value: 2 },
        { date: '2024-01-03T00:00:00.000' },
      ]);
    });
  });

  describe('explicit dateBounds + timezone (sub-day vs. day-and-coarser)', () => {
    // Regression coverage for the bug where dateBounds is picked as a UTC-anchored
    // calendar date/time (e.g. "2026-08-17T00:00:00.000Z" for Aug 17) but the real
    // timezone must be applied to line up with the actual bucketed data.

    it('shifts dateBounds to a real instant for sub-day (hour) granularity', () => {
      // dateBounds picked as "Aug 17" (UTC-anchored calendar day) with America/Los_Angeles
      // configured: real Pacific-day buckets run 2026-08-17T07:00Z .. 2026-08-18T06:59:59Z.
      const dateBounds = makeTimeRange(
        new Date('2026-08-17T00:00:00.000Z'),
        new Date('2026-08-17T23:59:59.999Z'),
      );
      mockTheme({ timezone: 'America/Los_Angeles' });

      const results = makeResults([
        { date: '2026-08-17T07:00:00.000Z', value: 10 }, // Pacific midnight
        { date: '2026-08-17T16:00:00.000Z', value: 20 }, // Pacific 9am
      ]);
      const dimension = makeDimension({ inputs: { granularity: 'hour', dateBounds } });

      const { result } = renderHook(() => useFillGaps({ results, dimension }));

      expect(result.current.data).toHaveLength(24);
      expect(result.current.data?.[0]).toEqual({ date: '2026-08-17T07:00:00.000Z', value: 10 });
      expect(result.current.data?.[1]).toEqual({ date: '2026-08-17T08:00:00.000' });
      expect(result.current.data?.[9]).toEqual({ date: '2026-08-17T16:00:00.000Z', value: 20 });
      expect(result.current.data?.[23]).toEqual({ date: '2026-08-18T06:00:00.000' });
    });

    it('does NOT shift dateBounds for day granularity (matches pseudo-UTC bucketed data)', () => {
      const dateBounds = makeTimeRange(
        new Date('2026-08-10T00:00:00.000Z'),
        new Date('2026-08-12T23:59:59.999Z'),
      );
      mockTheme({ timezone: 'America/Los_Angeles' });

      const results = makeResults([
        { date: '2026-08-10T00:00:00.000Z', value: 1 },
        { date: '2026-08-12T00:00:00.000Z', value: 3 },
      ]);
      const dimension = makeDimension({ inputs: { granularity: 'day', dateBounds } });

      const { result } = renderHook(() => useFillGaps({ results, dimension }));

      expect(result.current.data).toEqual([
        { date: '2026-08-10T00:00:00.000Z', value: 1 },
        { date: '2026-08-11T00:00:00.000' },
        { date: '2026-08-12T00:00:00.000Z', value: 3 },
      ]);
    });

    it('does NOT shift dateBounds for week/month/quarter/year granularities either', () => {
      const dateBounds = makeTimeRange(
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-03-31T23:59:59.999Z'),
      );
      mockTheme({ timezone: 'America/Los_Angeles' });

      const results = makeResults([
        { date: '2026-01-01T00:00:00.000Z', value: 1 },
        { date: '2026-03-01T00:00:00.000Z', value: 3 },
      ]);
      const dimension = makeDimension({ inputs: { granularity: 'month', dateBounds } });

      const { result } = renderHook(() => useFillGaps({ results, dimension }));

      expect(result.current.data).toEqual([
        { date: '2026-01-01T00:00:00.000Z', value: 1 },
        { date: '2026-02-01T00:00:00.000' },
        { date: '2026-03-01T00:00:00.000Z', value: 3 },
      ]);
    });

    it('falls back to plain UTC bounds when no client timezone is configured', () => {
      const dateBounds = makeTimeRange(
        new Date('2026-08-17T00:00:00.000Z'),
        new Date('2026-08-18T23:59:59.999Z'),
      );
      mockTheme({ timezone: undefined });

      const results = makeResults([{ date: '2026-08-17T00:00:00.000Z', value: 1 }]);
      const dimension = makeDimension({ inputs: { granularity: 'hour', dateBounds } });

      const { result } = renderHook(() => useFillGaps({ results, dimension }));

      // 48 hourly buckets from 2026-08-17T00:00Z through 2026-08-18T23:00Z, unshifted.
      expect(result.current.data).toHaveLength(48);
      expect(result.current.data?.[0]).toEqual({ date: '2026-08-17T00:00:00.000Z', value: 1 });
    });

    it('prefers externalDateBounds over the dimension dateBounds input', () => {
      const dimensionDateBounds = makeTimeRange(
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-01-31T23:59:59.999Z'),
      );
      const externalDateBounds = makeTimeRange(
        new Date('2026-02-01T00:00:00.000Z'),
        new Date('2026-02-02T23:59:59.999Z'),
      );
      mockTheme({ timezone: 'America/Los_Angeles' });

      const results = makeResults([{ date: '2026-02-01T00:00:00.000Z', value: 1 }]);
      const dimension = makeDimension({
        inputs: { granularity: 'day', dateBounds: dimensionDateBounds },
      });

      const { result } = renderHook(() => useFillGaps({ results, dimension, externalDateBounds }));

      expect(result.current.data).toEqual([
        { date: '2026-02-01T00:00:00.000Z', value: 1 },
        { date: '2026-02-02T00:00:00.000' },
      ]);
    });
  });
});
