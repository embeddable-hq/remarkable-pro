import type { ChartClickArgs } from '@embeddable.com/remarkable-ui';
import type { ChartData } from 'chart.js';
import type { Dimension, Measure } from '@embeddable.com/core';
import {
  createGroupedClickHandler,
  createSimpleClickHandler,
  getDatalabelPercentage,
  getDimensionWithoutTruncation,
  groupTailAsOther,
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

const makeMeasure = (name = 'value'): Measure =>
  ({ name, __type__: 'measure', inputs: {} }) as unknown as Measure;

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

  it('defaults data to an empty array when undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = groupTailAsOther(undefined as any, dimension, [measure], 3);
    expect(result).toEqual([]);
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

  it('passes undefined dimensionValue when elementAtEvent is empty', () => {
    const onClicked = vi.fn();
    mockGetTimeRange.mockReturnValue(undefined);

    const handler = createSimpleClickHandler({
      data: makeChartData(['A']),
      dimension: makeDimension(),
      onClicked,
    });

    handler({ elementAtEvent: [] } as unknown as ChartClickArgs);

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
      dimensionValue: '2024-01-01',
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
});
