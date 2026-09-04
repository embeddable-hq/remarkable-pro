import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import type { Dimension, DataResponse } from '@embeddable.com/core';
import { useFillGaps } from './charts.fillGaps.hooks';
import { defaultDateRangeOptions } from '../../theme/defaults/defaults.DateRanges.constants';
import { getTimeRangeFromDateRange } from '../editors/dates/dates.utils';

dayjs.extend(utc);

const isoKey = (date: Date): string => dayjs.utc(date).toISOString().split('Z')[0]!;

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

    const dimension = makeDimension({
      granularity: 'hour',
      dateBounds: { from, to, relativeTimeString: 'Today' },
    });

    const results = makeResults([
      {
        'daily_listens.listened_date': isoKey(
          dayjs
            .utc(from as Date)
            .add(3, 'hour')
            .toDate(),
        ),
      },
    ]);

    const { result } = renderHook(() => useFillGaps({ results, dimension }));

    const keys = result.current.data?.map((r) => r['daily_listens.listened_date']) ?? [];
    expect(keys.length).toBe(24);
    expect(keys[0]).toBe(isoKey(from as Date));
    expect(keys[23]).toBe(
      isoKey(
        dayjs
          .utc(from as Date)
          .add(23, 'hour')
          .toDate(),
      ),
    );
  });

  it('treats a manually-picked absolute range from the custom picker as already-safe (no double-conversion)', () => {
    mockUseTheme.mockReturnValue(makeTheme('America/Los_Angeles'));

    const pickedRange = getTimeRangeFromDateRange(
      { from: new Date('2026-06-15T00:00:00.000Z'), to: new Date('2026-06-15T23:59:59.999Z') },
      'America/Los_Angeles',
    )!;

    const dimension = makeDimension({
      granularity: 'hour',
      dateBounds: pickedRange,
    });

    const results = makeResults([
      { 'daily_listens.listened_date': isoKey(pickedRange.from as Date), value: 1 },
    ]);

    const { result } = renderHook(() => useFillGaps({ results, dimension }));

    const keys = result.current.data?.map((r) => r['daily_listens.listened_date']) ?? [];
    // 24 hourly buckets spanning the picked local day, anchored exactly at pickedRange.from
    expect(keys.length).toBe(24);
    expect(keys[0]).toBe(isoKey(pickedRange.from as Date));
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
});
