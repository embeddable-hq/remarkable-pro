import type { ChartClickArgs } from '@embeddable.com/remarkable-ui';
import type { ChartData } from 'chart.js';
import type { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import {
  computeOtherRows,
  createGroupedClickHandler,
  createSimpleClickHandler,
  getDatalabelPercentage,
  getDimensionWithoutTruncation,
  groupTailAsOther,
  isOtherBucketableMeasure,
  mergeGroupOtherResults,
  tagRowsAsOtherGroup,
} from './charts.utils';
import { i18n } from '../../theme/i18n/i18n';
import { getTimeRangeFromDimensionValue } from '../utils/dimension.utils';

// -- mocks -------------------------------------------------------------------

vi.mock('../../theme/i18n/i18n', () => ({
  i18n: { t: vi.fn((key: string) => `t(${key})`) },
}));

vi.mock('../utils/dimension.utils', () => ({
  getTimeRangeFromDimensionValue: vi.fn(),
}));

// -- helpers -----------------------------------------------------------------

const makeDimension = (name = 'category'): Dimension =>
  ({ name, __type__: 'dimension', inputs: {} }) as unknown as Dimension;

const makeMeasure = (name = 'value', aggType?: string): Measure =>
  ({
    name,
    __type__: 'measure',
    inputs: {},
    meta: aggType ? { aggType } : {},
  }) as unknown as Measure;

describe('getDatalabelPercentage', () => {
  it('returns 25% when value is 25 out of 100', () => {
    expect(getDatalabelPercentage(25, [25, 25, 25, 25])).toBe('25%');
  });

  it('returns 33.33% for 1 out of 3', () => {
    expect(getDatalabelPercentage(1, [1, 1, 1])).toBe('33.33%');
  });

  it('returns 66.67% for 2 out of 3', () => {
    expect(getDatalabelPercentage(2, [1, 1, 1])).toBe('66.67%');
  });

  it('returns 100% when value equals the total', () => {
    expect(getDatalabelPercentage(5, [5])).toBe('100%');
  });

  it('returns 0% when value is 0', () => {
    expect(getDatalabelPercentage(0, [1, 2, 3])).toBe('0%');
  });

  it('strips trailing decimal zeros (25.00 → 25)', () => {
    // toFixed(2) gives "25.00"; parseFloat strips it to 25
    expect(getDatalabelPercentage(1, [4])).toBe('25%');
  });

  it('handles string numbers in the data array', () => {
    // data is unknown[], so strings are valid — parseFloat handles them
    expect(getDatalabelPercentage(50, ['50', '50'] as unknown[])).toBe('50%');
  });

  it('respects decimalPlaces=0 (rounds to integer)', () => {
    expect(getDatalabelPercentage(1, [1, 1, 1], 0)).toBe('33%');
  });

  it('respects decimalPlaces=1', () => {
    expect(getDatalabelPercentage(1, [1, 1, 1], 1)).toBe('33.3%');
  });

  it('respects decimalPlaces=4', () => {
    expect(getDatalabelPercentage(1, [1, 1, 1], 4)).toBe('33.3333%');
  });

  it('defaults to 2 decimal places when decimalPlaces is undefined', () => {
    expect(getDatalabelPercentage(1, [1, 1, 1], undefined)).toBe('33.33%');
  });
});

describe('getDimensionWithoutTruncation', () => {
  it('returns a new dimension object with maxCharacters set to null', () => {
    const dimensionWithMaxChars: Dimension = {
      name: 'category',
      __type__: 'dimension',
      inputs: { maxCharacters: 10 },
    } as unknown as Dimension;

    const result = getDimensionWithoutTruncation(dimensionWithMaxChars);

    expect(result).not.toBe(dimensionWithMaxChars); // should be a new object
    expect(result.name).toBe(dimensionWithMaxChars.name); // name should be unchanged
    expect(result.__type__).toBe(dimensionWithMaxChars.__type__); // type should be unchanged
    expect(result.inputs?.maxCharacters).toBeNull(); // maxCharacters should be null
  });
});

describe('groupTailAsOther', () => {
  const dimension = makeDimension('category');
  const measure = makeMeasure('value');

  it('returns data unchanged when maxItems is not provided', () => {
    const data = [
      { category: 'A', value: 1 },
      { category: 'B', value: 2 },
      { category: 'C', value: 3 },
    ];
    expect(groupTailAsOther(data, dimension, [measure])).toBe(data);
  });

  it('returns data unchanged when data length is within maxItems', () => {
    const data = [
      { category: 'A', value: 1 },
      { category: 'B', value: 2 },
    ];
    expect(groupTailAsOther(data, dimension, [measure], 3)).toBe(data);
  });

  it('returns data unchanged when data length equals maxItems', () => {
    const data = [
      { category: 'A', value: 1 },
      { category: 'B', value: 2 },
    ];
    expect(groupTailAsOther(data, dimension, [measure], 2)).toBe(data);
  });

  it('groups tail rows into a single "Other" row when data exceeds maxItems', () => {
    const data = [
      { category: 'A', value: 10 },
      { category: 'B', value: 20 },
      { category: 'C', value: 30 },
      { category: 'D', value: 40 },
    ];

    const result = groupTailAsOther(data, dimension, [measure], 3);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ category: 'A', value: 10 });
    expect(result[1]).toEqual({ category: 'B', value: 20 });
    expect(result[2]).toEqual({ category: 't(common.other)', value: 70 }); // C(30) + D(40)
  });

  it('uses i18n.t("common.other") as the dimension value for the aggregated row', () => {
    const data = [
      { category: 'A', value: 1 },
      { category: 'B', value: 2 },
      { category: 'C', value: 3 },
    ];

    groupTailAsOther(data, dimension, [measure], 2);

    expect(vi.mocked(i18n.t)).toHaveBeenCalledWith('common.other');
  });

  it('aggregates multiple measures independently in the "Other" row', () => {
    const m1 = makeMeasure('sales');
    const m2 = makeMeasure('units');
    const data = [
      { category: 'A', sales: 100, units: 5 },
      { category: 'B', sales: 200, units: 10 },
      { category: 'C', sales: 300, units: 15 },
    ];

    const result = groupTailAsOther(data, dimension, [m1, m2], 2);

    expect(result).toHaveLength(2);
    expect(result[1]?.sales).toBe(500); // B(200) + C(300)
    expect(result[1]?.units).toBe(25); // B(10) + C(15)
  });

  it('treats missing measure values as 0 during aggregation', () => {
    const data = [
      { category: 'A', value: 10 },
      { category: 'B', value: 20 },
      { category: 'C' }, // no value field
    ];

    const result = groupTailAsOther(data, dimension, [measure], 2);

    // tail = B(20) + C(0) = 20
    expect(result[1]?.value).toBe(20);
  });

  it('averages tail values for avg measures', () => {
    const measure = makeMeasure('score', 'avg');
    const data = [
      { category: 'A', score: 80 },
      { category: 'B', score: 60 },
      { category: 'C', score: 40 },
    ];

    const result = groupTailAsOther(data, dimension, [measure], 2);

    // tail = B(60) + C(40) → avg = 50
    expect(result[1]?.score).toBe(50);
  });

  it('takes min of tail values for min measures', () => {
    const measure = makeMeasure('score', 'min');
    const data = [
      { category: 'A', score: 80 },
      { category: 'B', score: 60 },
      { category: 'C', score: 40 },
    ];

    const result = groupTailAsOther(data, dimension, [measure], 2);

    // tail = B(60), C(40) → min = 40
    expect(result[1]?.score).toBe(40);
  });

  it('takes max of tail values for max measures', () => {
    const measure = makeMeasure('score', 'max');
    const data = [
      { category: 'A', score: 80 },
      { category: 'B', score: 60 },
      { category: 'C', score: 40 },
    ];

    const result = groupTailAsOther(data, dimension, [measure], 2);

    // tail = B(60), C(40) → max = 60
    expect(result[1]?.score).toBe(60);
  });

  it('aggregates mixed aggTypes correctly across multiple measures', () => {
    const sumMeasure = makeMeasure('revenue');
    const avgMeasure = makeMeasure('avg_order', 'avg');
    const data = [
      { category: 'A', revenue: 1000, avg_order: 100 },
      { category: 'B', revenue: 200, avg_order: 50 },
      { category: 'C', revenue: 300, avg_order: 30 },
    ];

    const result = groupTailAsOther(data, dimension, [sumMeasure, avgMeasure], 2);

    expect(result[1]?.revenue).toBe(500); // B(200) + C(300)
    expect(result[1]?.avg_order).toBe(40); // (B(50) + C(30)) / 2
  });

  it('falls back to sum when no meta.aggType is specified (backward compatibility)', () => {
    const measure = makeMeasure('value');
    const data = [
      { category: 'A', value: 10 },
      { category: 'B', value: 20 },
      { category: 'C', value: 30 },
    ];

    const result = groupTailAsOther(data, dimension, [measure], 2);

    // tail = B(20) + C(30) → sum = 50
    expect(result[1]?.value).toBe(50);
  });

  it('defaults data to an empty array when undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = groupTailAsOther(undefined as any, dimension, [measure], 3);
    expect(result).toEqual([]);
  });
});

describe('isOtherBucketableMeasure', () => {
  it('returns true when the measure has no aggType', () => {
    expect(isOtherBucketableMeasure(makeMeasure('value'))).toBe(true);
  });

  it('returns true for sum aggType', () => {
    expect(isOtherBucketableMeasure(makeMeasure('value', 'sum'))).toBe(true);
  });

  it('returns true for count aggType', () => {
    expect(isOtherBucketableMeasure(makeMeasure('value', 'count'))).toBe(true);
  });

  it('returns false for avg aggType', () => {
    expect(isOtherBucketableMeasure(makeMeasure('value', 'avg'))).toBe(false);
  });

  it('returns false for min aggType', () => {
    expect(isOtherBucketableMeasure(makeMeasure('value', 'min'))).toBe(false);
  });

  it('returns false for max aggType', () => {
    expect(isOtherBucketableMeasure(makeMeasure('value', 'max'))).toBe(false);
  });

  it('returns false for count_distinct aggType', () => {
    // Not additive across groups: a value counted under more than one group
    // would be counted once per group, so grandTotal - sum(kept groups) does
    // not recover the excluded groups' true distinct count.
    expect(isOtherBucketableMeasure(makeMeasure('value', 'count_distinct'))).toBe(false);
  });

  it('returns false for count_distinct_approx aggType', () => {
    expect(isOtherBucketableMeasure(makeMeasure('value', 'count_distinct_approx'))).toBe(false);
  });

  it('returns false for an unrecognized aggType (rejects by default rather than assuming safe)', () => {
    expect(isOtherBucketableMeasure(makeMeasure('value', 'some_future_aggtype'))).toBe(false);
  });
});

describe('tagRowsAsOtherGroup', () => {
  const groupBy = makeDimension('product');

  it('tags every row with i18n.t("common.other") under the groupBy field name', () => {
    const data = [
      { product: 'Widget', value: 5 },
      { product: 'Gadget', value: 7 },
    ];
    const result = tagRowsAsOtherGroup(data, groupBy);
    expect(result).toEqual([
      { product: 't(common.other)', value: 5 },
      { product: 't(common.other)', value: 7 },
    ]);
  });

  it('defaults to an empty array when data is undefined', () => {
    expect(tagRowsAsOtherGroup(undefined, groupBy)).toEqual([]);
  });

  it('uses the granularity-suffixed field name for a time-typed groupBy dimension', () => {
    const timeGroupBy = {
      name: 'date',
      __type__: 'dimension',
      nativeType: 'time',
      inputs: { granularity: 'month' },
    } as unknown as Dimension;
    const data = [{ 'date.month': 'irrelevant', value: 9 }];
    const result = tagRowsAsOtherGroup(data, timeGroupBy);
    expect(result).toEqual([{ 'date.month': 't(common.other)', value: 9 }]);
  });
});

describe('computeOtherRows', () => {
  const axis = makeDimension('date');
  const groupBy = makeDimension('product');
  const measure = makeMeasure('value');

  it('returns [] when grandTotalData is empty or undefined', () => {
    expect(
      computeOtherRows(
        [{ date: '2026-01-01', product: 'Widget', value: 10 }],
        [],
        axis,
        measure,
        groupBy,
      ),
    ).toEqual([]);
    expect(
      computeOtherRows(
        [{ date: '2026-01-01', product: 'Widget', value: 10 }],
        undefined,
        axis,
        measure,
        groupBy,
      ),
    ).toEqual([]);
  });

  it('computes Other as grandTotal minus the sum of kept groups, per axis bucket', () => {
    const mainData = [{ date: '2026-01-01', product: 'Widget', value: 10 }];
    const grandTotalData = [{ date: '2026-01-01', value: 30 }];

    const result = computeOtherRows(mainData, grandTotalData, axis, measure, groupBy);

    expect(result).toEqual([{ date: '2026-01-01', product: 't(common.other)', value: 20 }]);
  });

  it('sums multiple kept groups for the same axis bucket before subtracting', () => {
    const mainData = [
      { date: '2026-01-01', product: 'Widget', value: 10 },
      { date: '2026-01-01', product: 'Gizmo', value: 5 },
    ];
    const grandTotalData = [{ date: '2026-01-01', value: 30 }];

    const result = computeOtherRows(mainData, grandTotalData, axis, measure, groupBy);

    expect(result).toEqual([{ date: '2026-01-01', product: 't(common.other)', value: 15 }]);
  });

  it('is correct regardless of excluded-group naming — the exact bug notContains would hit', () => {
    // Kept: "Widget" only. Excluded (never named here, that's the point): "Widget
    // Pro" and "Gadget". A notContains(['Widget']) filter would ALSO match
    // "Widget Pro" as a substring and wrongly exclude its contribution from the
    // Other aggregate entirely. Subtraction doesn't care what the excluded
    // groups are named — it's just grandTotal minus kept, so "Widget Pro"'s
    // value correctly ends up inside Other.
    const mainData = [{ date: '2026-01-01', product: 'Widget', value: 10 }];
    // grand total = Widget(10) + "Widget Pro"(15) + Gadget(5) = 30
    const grandTotalData = [{ date: '2026-01-01', value: 30 }];

    const result = computeOtherRows(mainData, grandTotalData, axis, measure, groupBy);

    expect(result).toEqual([{ date: '2026-01-01', product: 't(common.other)', value: 20 }]);
  });

  it('treats an axis bucket with no kept-group data as a kept total of 0', () => {
    const mainData: DataResponse['data'] = [];
    const grandTotalData = [{ date: '2026-01-01', value: 30 }];

    const result = computeOtherRows(mainData, grandTotalData, axis, measure, groupBy);

    expect(result).toEqual([{ date: '2026-01-01', product: 't(common.other)', value: 30 }]);
  });

  it('computes independently per axis bucket', () => {
    const mainData = [
      { date: '2026-01-01', product: 'Widget', value: 10 },
      { date: '2026-01-02', product: 'Widget', value: 4 },
    ];
    const grandTotalData = [
      { date: '2026-01-01', value: 30 },
      { date: '2026-01-02', value: 4 },
    ];

    const result = computeOtherRows(mainData, grandTotalData, axis, measure, groupBy);

    expect(result).toEqual([
      { date: '2026-01-01', product: 't(common.other)', value: 20 },
      { date: '2026-01-02', product: 't(common.other)', value: 0 },
    ]);
  });

  it('clamps to 0 instead of going negative on floating-point noise', () => {
    const mainData = [{ date: '2026-01-01', product: 'Widget', value: 10.0000001 }];
    const grandTotalData = [{ date: '2026-01-01', value: 10 }];

    const result = computeOtherRows(mainData, grandTotalData, axis, measure, groupBy);

    expect(result).toEqual([{ date: '2026-01-01', product: 't(common.other)', value: 0 }]);
  });

  it('drops grand-total rows with a null/undefined axis value', () => {
    const mainData: DataResponse['data'] = [];
    const grandTotalData = [{ date: null, value: 30 }];

    const result = computeOtherRows(mainData, grandTotalData, axis, measure, groupBy);

    expect(result).toEqual([]);
  });
});

describe('mergeGroupOtherResults', () => {
  const axis = makeDimension('date');
  const groupBy = makeDimension('product');
  const measure = makeMeasure('value');

  it('returns mainResults unchanged when it is undefined', () => {
    expect(mergeGroupOtherResults(undefined, undefined, groupBy, axis, measure)).toBeUndefined();
  });

  it('appends Other rows (computed by subtraction) once mainResults has settled', () => {
    const mainResults = {
      data: [{ date: '2026-01-01', product: 'Widget', value: 10 }],
      isLoading: false,
    } as unknown as DataResponse;
    const resultsGroupOther = {
      data: [{ date: '2026-01-01', value: 30 }],
      isLoading: false,
    } as unknown as DataResponse;

    const result = mergeGroupOtherResults(mainResults, resultsGroupOther, groupBy, axis, measure);

    expect(result?.data).toEqual([
      { date: '2026-01-01', product: 'Widget', value: 10 },
      { date: '2026-01-01', product: 't(common.other)', value: 20 },
    ]);
    expect(result?.isLoading).toBe(false);
  });

  it('does NOT include Other rows while mainResults is still loading, even if resultsGroupOther already has data', () => {
    // This is the regression case: resultsGroupOther resolving before mainResults
    // must never produce a merged dataset containing only the Other row, since
    // that would permanently cache Other's color at index 0 and collide with
    // whichever real group value later lands at index 0. It also matters more
    // now: mainResults still loading means "kept totals" are incomplete, so
    // computing Other early would massively over-count it too.
    const mainResults = { data: [], isLoading: true } as unknown as DataResponse;
    const resultsGroupOther = {
      data: [{ date: '2026-01-01', value: 30 }],
      isLoading: false,
    } as unknown as DataResponse;

    const result = mergeGroupOtherResults(mainResults, resultsGroupOther, groupBy, axis, measure);

    expect(result?.data).toEqual([]);
  });

  it('includes Other rows once mainResults settles on a later call, after being excluded while loading', () => {
    const loadingMain = { data: [], isLoading: true } as unknown as DataResponse;
    const resultsGroupOther = {
      data: [{ date: '2026-01-01', value: 30 }],
      isLoading: false,
    } as unknown as DataResponse;

    expect(
      mergeGroupOtherResults(loadingMain, resultsGroupOther, groupBy, axis, measure)?.data,
    ).toEqual([]);

    const settledMain = {
      data: [{ date: '2026-01-01', product: 'Widget', value: 10 }],
      isLoading: false,
    } as unknown as DataResponse;

    expect(
      mergeGroupOtherResults(settledMain, resultsGroupOther, groupBy, axis, measure)?.data,
    ).toEqual([
      { date: '2026-01-01', product: 'Widget', value: 10 },
      { date: '2026-01-01', product: 't(common.other)', value: 20 },
    ]);
  });

  it('marks the merged result as loading when resultsGroupOther is still loading, even if mainResults has settled', () => {
    const mainResults = {
      data: [{ date: '2026-01-01', product: 'Widget', value: 10 }],
      isLoading: false,
    } as unknown as DataResponse;
    const resultsGroupOther = { data: undefined, isLoading: true } as unknown as DataResponse;

    const result = mergeGroupOtherResults(mainResults, resultsGroupOther, groupBy, axis, measure);

    expect(result?.isLoading).toBe(true);
    expect(result?.data).toEqual([{ date: '2026-01-01', product: 'Widget', value: 10 }]);
  });

  it('does NOT compute Other rows from stale resultsGroupOther.data while it is still loading, even though mainResults has settled', () => {
    // Regression case: a data layer that keeps a query's previous data visible
    // while it re-fetches (isLoading: true, data: <stale rows from an earlier
    // config>) must not have that stale data folded into Other just because
    // mainResults happens to have already settled — both queries must settle
    // before Other is computed at all.
    const mainResults = {
      data: [{ date: '2026-01-01', product: 'Widget', value: 10 }],
      isLoading: false,
    } as unknown as DataResponse;
    const staleResultsGroupOther = {
      data: [{ date: '2026-01-01', value: 999 }], // stale grand total from a prior render
      isLoading: true,
    } as unknown as DataResponse;

    const result = mergeGroupOtherResults(
      mainResults,
      staleResultsGroupOther,
      groupBy,
      axis,
      measure,
    );

    expect(result?.data).toEqual([{ date: '2026-01-01', product: 'Widget', value: 10 }]);
    expect(result?.isLoading).toBe(true);
  });

  it('combines errors from both sources', () => {
    const mainResults = { data: [], isLoading: false, error: undefined } as unknown as DataResponse;
    const resultsGroupOther = {
      data: [],
      isLoading: false,
      error: 'other query failed',
    } as unknown as DataResponse;

    const result = mergeGroupOtherResults(mainResults, resultsGroupOther, groupBy, axis, measure);

    expect(result?.error).toBe('other query failed');
  });

  it('treats a missing resultsGroupOther as no Other rows', () => {
    const mainResults = {
      data: [{ date: '2026-01-01', product: 'Widget', value: 10 }],
      isLoading: false,
    } as unknown as DataResponse;

    const result = mergeGroupOtherResults(mainResults, undefined, groupBy, axis, measure);

    expect(result?.data).toEqual([{ date: '2026-01-01', product: 'Widget', value: 10 }]);
    expect(result?.isLoading).toBe(false);
  });
});

// -- createSimpleClickHandler / createGroupedClickHandler --------------------

const makeTimeDimension = (name = 'date'): Dimension =>
  ({ name, __type__: 'dimension', nativeType: 'time', inputs: {} }) as unknown as Dimension;

const makeClick = (index: number, datasetIndex = 0): ChartClickArgs =>
  ({ elementAtEvent: [{ index, datasetIndex }] }) as unknown as ChartClickArgs;

const makeChartData = (labels: string[], datasets: { rawLabel?: string }[] = []): ChartData =>
  ({ labels, datasets }) as unknown as ChartData;

describe('createSimpleClickHandler', () => {
  const mockGetTimeRange = vi.mocked(getTimeRangeFromDimensionValue);

  beforeEach(() => {
    mockGetTimeRange.mockReset();
  });

  it('calls onClicked with the dimensionValue from labels at the clicked index', () => {
    const onClicked = vi.fn();
    const dimension = makeDimension('category');
    mockGetTimeRange.mockReturnValue(undefined);

    const handler = createSimpleClickHandler({
      data: makeChartData(['Apple', 'Banana', 'Cherry']),
      dimension,
      onClicked,
    });

    handler(makeClick(1));

    expect(onClicked).toHaveBeenCalledWith(expect.objectContaining({ dimensionValue: 'Banana' }));
  });

  it('calls onClicked with the dimensionTimeRange returned by getTimeRangeFromDimensionValue', () => {
    const onClicked = vi.fn();
    const dimension = makeTimeDimension();
    const fakeRange = {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31'),
      relativeTimeString: undefined,
    };
    mockGetTimeRange.mockReturnValue(fakeRange);

    const handler = createSimpleClickHandler({
      data: makeChartData(['2024-01-01']),
      dimension,
      onClicked,
    });

    handler(makeClick(0));

    expect(onClicked).toHaveBeenCalledWith(
      expect.objectContaining({ dimensionTimeRange: fakeRange }),
    );
  });

  it('passes dimension and granularity to getTimeRangeFromDimensionValue', () => {
    const dimension = makeDimension('category');
    mockGetTimeRange.mockReturnValue(undefined);

    const handler = createSimpleClickHandler({
      data: makeChartData(['A']),
      dimension,
      granularity: 'month',
      onClicked: vi.fn(),
    });

    handler(makeClick(0));

    expect(mockGetTimeRange).toHaveBeenCalledWith({
      value: 'A',
      stateGranularity: 'month',
      dimension,
    });
  });

  it('does not throw when onClicked is undefined', () => {
    mockGetTimeRange.mockReturnValue(undefined);

    const handler = createSimpleClickHandler({
      data: makeChartData(['A']),
      dimension: makeDimension(),
    });

    expect(() => handler(makeClick(0))).not.toThrow();
  });

  it('does not call onClicked when elementAtEvent is empty', () => {
    const onClicked = vi.fn();
    mockGetTimeRange.mockReturnValue(undefined);

    const handler = createSimpleClickHandler({
      data: makeChartData(['A']),
      dimension: makeDimension(),
      onClicked,
    });

    handler({ elementAtEvent: [] } as unknown as ChartClickArgs);

    expect(onClicked).not.toHaveBeenCalled();
  });

  it('builds measureValues from the datasets at the clicked index when measures are provided', () => {
    const onClicked = vi.fn();
    mockGetTimeRange.mockReturnValue(undefined);

    const data = {
      labels: ['Apple', 'Banana'],
      datasets: [{ data: [10, 20] }, { data: [30, 40] }],
    } as unknown as ChartData;

    const handler = createSimpleClickHandler({
      data,
      dimension: makeDimension('category'),
      measures: [makeMeasure('sales'), makeMeasure('profit')],
      onClicked,
    });

    handler(makeClick(1));

    expect(onClicked).toHaveBeenCalledWith(
      expect.objectContaining({ measureValues: { sales: 20, profit: 40 } }),
    );
  });

  it('sets dimensionValue to undefined when a dimensionTimeRange is derived', () => {
    const onClicked = vi.fn();
    mockGetTimeRange.mockReturnValue({
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31'),
      relativeTimeString: undefined,
    });

    const handler = createSimpleClickHandler({
      data: makeChartData(['2024-01-01']),
      dimension: makeTimeDimension(),
      onClicked,
    });

    handler(makeClick(0));

    expect(onClicked).toHaveBeenCalledWith(expect.objectContaining({ dimensionValue: undefined }));
  });
});

describe('createGroupedClickHandler', () => {
  const mockGetTimeRange = vi.mocked(getTimeRangeFromDimensionValue);

  beforeEach(() => {
    mockGetTimeRange.mockReset();
  });

  it('calls onClicked with dimensionValue from labels and groupingDimensionValue from dataset rawLabel', () => {
    const onClicked = vi.fn();
    mockGetTimeRange.mockReturnValue(undefined);

    const handler = createGroupedClickHandler({
      data: makeChartData(
        ['North', 'South'],
        [{ rawLabel: 'Electronics' }, { rawLabel: 'Clothing' }],
      ),
      dimension: makeDimension('region'),
      groupBy: makeDimension('category'),
      onClicked,
    });

    handler(makeClick(1, 0));

    expect(onClicked).toHaveBeenCalledWith(
      expect.objectContaining({
        dimensionValue: 'South',
        groupingDimensionValue: 'Electronics',
      }),
    );
  });

  it('calls getTimeRangeFromDimensionValue separately for dimension and groupBy', () => {
    const dimension = makeTimeDimension('date');
    const groupBy = makeTimeDimension('category');
    const dimRange = {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31'),
      relativeTimeString: undefined,
    };
    const groupRange = {
      from: new Date('2024-02-01'),
      to: new Date('2024-02-29'),
      relativeTimeString: undefined,
    };

    mockGetTimeRange.mockReturnValueOnce(dimRange).mockReturnValueOnce(groupRange);

    const onClicked = vi.fn();
    const handler = createGroupedClickHandler({
      data: makeChartData(['2024-01-01'], [{ rawLabel: '2024-02-01' }]),
      dimension,
      groupBy,
      onClicked,
    });

    handler(makeClick(0, 0));

    expect(mockGetTimeRange).toHaveBeenCalledWith({
      value: '2024-01-01',
      stateGranularity: undefined,
      dimension,
    });
    expect(mockGetTimeRange).toHaveBeenCalledWith({
      value: '2024-02-01',
      dimension: groupBy,
    });
    expect(onClicked).toHaveBeenCalledWith({
      dimensionValue: undefined,
      dimensionTimeRange: dimRange,
      groupingDimensionValue: '2024-02-01',
      groupingDimensionTimeRange: groupRange,
    });
  });

  it('passes granularity to getTimeRangeFromDimensionValue for the primary dimension', () => {
    const dimension = makeDimension('date');
    const groupBy = makeDimension('category');
    mockGetTimeRange.mockReturnValue(undefined);

    const handler = createGroupedClickHandler({
      data: makeChartData(['A'], [{ rawLabel: 'G' }]),
      dimension,
      groupBy,
      granularity: 'week',
      onClicked: vi.fn(),
    });

    handler(makeClick(0, 0));

    expect(mockGetTimeRange).toHaveBeenCalledWith(
      expect.objectContaining({ stateGranularity: 'week', dimension }),
    );
  });

  it('passes undefined groupingDimensionValue when dataset has no rawLabel', () => {
    const onClicked = vi.fn();
    mockGetTimeRange.mockReturnValue(undefined);

    const handler = createGroupedClickHandler({
      data: makeChartData(['A'], [{}]),
      dimension: makeDimension(),
      groupBy: makeDimension('g'),
      onClicked,
    });

    handler(makeClick(0, 0));

    expect(onClicked).toHaveBeenCalledWith(
      expect.objectContaining({ groupingDimensionValue: undefined }),
    );
  });

  it('does not throw when onClicked is undefined', () => {
    mockGetTimeRange.mockReturnValue(undefined);

    const handler = createGroupedClickHandler({
      data: makeChartData(['A'], [{ rawLabel: 'G' }]),
      dimension: makeDimension(),
      groupBy: makeDimension('g'),
    });

    expect(() => handler(makeClick(0, 0))).not.toThrow();
  });

  it('does not call onClicked when elementAtEvent is empty', () => {
    const onClicked = vi.fn();
    mockGetTimeRange.mockReturnValue(undefined);

    const handler = createGroupedClickHandler({
      data: makeChartData(['A'], [{ rawLabel: 'G' }]),
      dimension: makeDimension(),
      groupBy: makeDimension('g'),
      onClicked,
    });

    handler({ elementAtEvent: [] } as unknown as ChartClickArgs);

    expect(onClicked).not.toHaveBeenCalled();
  });
});
