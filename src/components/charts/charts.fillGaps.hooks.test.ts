import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import type { Dimension, DataResponse } from '@embeddable.com/core';
import { useFillGaps } from './charts.fillGaps.hooks';
import { defaultDateRangeOptions } from '../../theme/defaults/defaults.DateRanges.constants';
import { getTimeRangeFromDateRange } from '../editors/dates/dates.utils';

dayjs.extend(utc);
dayjs.extend(timezone);

// `dateBounds` values from a preset/picker are genuine real instants (e.g.
// "Today" at midnight America/Los_Angeles is a real 07:00 UTC in PDT) -- not
// raw UTC digits standing in for local ones. Mirror the same real-timezone
// conversion `resolveBoundary` applies in charts.fillGaps.hooks.ts to compute
// the local-digit key a matching record/bucket should have.
const localAnchor = (date: Date, tz: string): dayjs.Dayjs =>
  dayjs.utc(dayjs(date).tz(tz).format('YYYY-MM-DDTHH:mm:ss.SSS'));

const localKey = (date: Date, tz: string): string =>
  localAnchor(date, tz).toISOString().split('Z')[0]!;

const mockUseTheme = vi.fn();

vi.mock('@embeddable.com/react', () => ({
  useTheme: () => mockUseTheme(),
}));

const makeTheme = (timezone?: string) => ({
  clientContext: { timezone },
  defaults: { dateRangesOptions: defaultDateRangeOptions },
});

const makeDimension = (overrides: Record<string, unknown> = {}): Dimension =>
  ({
    name: 'daily_listens.listened_date',
    title: 'Listened Date',
    nativeType: 'time',
    __type__: 'dimension',
    inputs: {
      granularity: 'hour',
      ...overrides,
    },
  }) as unknown as Dimension;

const makeResults = (data: Record<string, unknown>[]): DataResponse => ({
  isLoading: false,
  data,
});

describe('useFillGaps', () => {
  it('fills gaps correctly in UTC with no dateBounds (baseline, no regression)', () => {
    mockUseTheme.mockReturnValue(makeTheme('UTC'));

    const dimension = makeDimension();
    const results = makeResults([
      { 'daily_listens.listened_date': '2026-01-01T00:00:00.000', value: 1 },
      { 'daily_listens.listened_date': '2026-01-01T02:00:00.000', value: 2 },
    ]);

    const { result } = renderHook(() => useFillGaps({ results, dimension }));

    const keys = result.current.data?.map((r) => r['daily_listens.listened_date']);
    expect(keys).toEqual([
      '2026-01-01T00:00:00.000',
      '2026-01-01T01:00:00.000',
      '2026-01-01T02:00:00.000',
    ]);
  });

  it('respects a day-precision preset dateBounds in a non-UTC timezone (PR #271 case, unchanged)', () => {
    mockUseTheme.mockReturnValue(makeTheme('America/Los_Angeles'));

    const todayOption = defaultDateRangeOptions.find((opt) => opt.value === 'Today')!;
    const { from, to } = todayOption.getRange('America/Los_Angeles')!;

    // Compute every expected/seed key once, up front, and reuse the saved strings below
    // rather than re-deriving them after renderHook -- see PR discussion for why.
    const anchor = localAnchor(from as Date, 'America/Los_Angeles');
    const firstKey = anchor.toISOString().split('Z')[0]!;
    const thirdHourKey = anchor.add(3, 'hour').toISOString().split('Z')[0]!;
    const lastKey = anchor.add(23, 'hour').toISOString().split('Z')[0]!;

    const dimension = makeDimension({
      granularity: 'hour',
      dateBounds: { from, to, relativeTimeString: 'Today' },
    });

    const results = makeResults([{ 'daily_listens.listened_date': thirdHourKey }]);

    const { result } = renderHook(() => useFillGaps({ results, dimension }));

    const keys = result.current.data?.map((r) => r['daily_listens.listened_date']) ?? [];
    expect(keys.length).toBe(24);
    expect(keys[0]).toBe(firstKey);
    expect(keys[23]).toBe(lastKey);
  });

  it('treats a manually-picked absolute range from the custom picker as already-safe (no double-conversion)', () => {
    mockUseTheme.mockReturnValue(makeTheme('America/Los_Angeles'));

    const pickedRange = getTimeRangeFromDateRange(
      { from: new Date('2026-06-15T00:00:00.000Z'), to: new Date('2026-06-15T23:59:59.999Z') },
      'America/Los_Angeles',
    )!;

    // Compute the expected/seed key once, up front, and reuse the saved string below
    // rather than re-deriving it after renderHook -- see PR discussion for why.
    const firstKey = localKey(pickedRange.from as Date, 'America/Los_Angeles');

    const dimension = makeDimension({
      granularity: 'hour',
      dateBounds: pickedRange,
    });

    const results = makeResults([{ 'daily_listens.listened_date': firstKey, value: 1 }]);

    const { result } = renderHook(() => useFillGaps({ results, dimension }));

    const keys = result.current.data?.map((r) => r['daily_listens.listened_date']) ?? [];
    // 24 hourly buckets spanning the picked local day, anchored exactly at pickedRange.from
    expect(keys.length).toBe(24);
    expect(keys[0]).toBe(firstKey);
  });

  it('correctly fills an hour-granularity chart bound to a live/rolling range (regression for the reported bug)', () => {
    mockUseTheme.mockReturnValue(makeTheme('America/Los_Angeles'));

    // Real shape reproduced from the reported bug: 25 continuous naive-local hourly
    // records (Cube already converted them to America/Los_Angeles wall-clock time),
    // bound by a genuine real "last 24 hours" instant pair (PDT is UTC-7 in September,
    // so the local 05:51:14 boundary is 12:51:14 in real UTC).
    const data = Array.from({ length: 25 }, (_, i) => {
      const stamp = dayjs.utc('2026-09-02T05:00:00.000').add(i, 'hour');
      return { 'speed.timestamp': stamp.toISOString().split('Z')[0], value: i };
    });

    const dimension = makeDimension({
      granularity: 'hour',
      dateBounds: {
        from: new Date('2026-09-02T12:51:14.000Z'),
        to: new Date('2026-09-03T12:51:14.999Z'),
        relativeTimeString: undefined,
      },
    });

    const dimensionWithName = { ...dimension, name: 'speed.timestamp' } as unknown as Dimension;

    const { result } = renderHook(() =>
      useFillGaps({ results: makeResults(data), dimension: dimensionWithName }),
    );

    const rows = result.current.data ?? [];
    const nullRows = rows.filter((r) => r.value === undefined);

    expect(rows.length).toBe(25);
    expect(nullRows.length).toBe(0);
  });

  it('converts a live dateBounds provided as ISO strings with a "Z" offset (customer-reported regression)', () => {
    mockUseTheme.mockReturnValue(makeTheme('America/Los_Angeles'));

    // No relativeTimeString, so dateBoundsTmp is used as-is -- and here it arrives
    // as plain strings rather than Date instances, exactly as reported.
    const dimension = makeDimension({
      dateBounds: {
        from: '2026-09-04T13:55:09.000Z',
        to: '2026-09-04T14:56:09.999Z',
      },
    });

    const results = makeResults([
      { 'daily_listens.listened_date': '2026-09-04T06:00:00.000', value: 1 },
      { 'daily_listens.listened_date': '2026-09-04T07:00:00.000', value: 2 },
    ]);

    const { result } = renderHook(() => useFillGaps({ results, dimension }));

    expect(result.current.data).toEqual(results.data);
  });

  it('converts a live dateBounds string with an explicit +/-HH:MM offset', () => {
    mockUseTheme.mockReturnValue(makeTheme('America/Los_Angeles'));

    // Same real instants as the "Z" test above, just spelled with an explicit
    // numeric offset instead of "Z".
    const dimension = makeDimension({
      dateBounds: {
        from: '2026-09-04T06:55:09.000-07:00',
        to: '2026-09-04T07:56:09.999-07:00',
      },
    });

    const results = makeResults([
      { 'daily_listens.listened_date': '2026-09-04T06:00:00.000', value: 1 },
      { 'daily_listens.listened_date': '2026-09-04T07:00:00.000', value: 2 },
    ]);

    const { result } = renderHook(() => useFillGaps({ results, dimension }));

    expect(result.current.data).toEqual(results.data);
  });

  it('leaves a naive, offset-less string dateBounds unconverted (no regression)', () => {
    mockUseTheme.mockReturnValue(makeTheme('America/Los_Angeles'));

    // No "Z" or numeric offset -- this is how record data and the existing
    // day-precision preset/picker output are shaped, and must not be re-converted.
    const dimension = makeDimension({
      dateBounds: {
        from: '2026-01-01T00:00:00.000',
        to: '2026-01-01T23:59:59.999',
      },
    });

    const results = makeResults([
      { 'daily_listens.listened_date': '2026-01-01T03:00:00.000', value: 1 },
    ]);

    const { result } = renderHook(() => useFillGaps({ results, dimension }));

    const keys = result.current.data?.map((r) => r['daily_listens.listened_date']) ?? [];
    expect(keys.length).toBe(24);
    expect(keys[0]).toBe('2026-01-01T00:00:00.000');
    expect(keys[23]).toBe('2026-01-01T23:00:00.000');
  });
});
