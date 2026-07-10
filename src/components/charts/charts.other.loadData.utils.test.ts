import type { DataResponse, Dataset, Measure } from '@embeddable.com/core';
import { vi } from 'vitest';
import {
  getAdditiveMeasures,
  getMeasureTotals,
  getTopItemsOrderBy,
  isAdditiveMeasure,
  isResultTruncated,
  loadOtherTotal,
  otherTotalLoadDataArgs,
} from './charts.other.loadData.utils';

const mockLoadData = vi.fn(
  (...args: unknown[]) => ({ __request: args[0] }) as unknown as DataResponse,
);
vi.mock('@embeddable.com/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@embeddable.com/core')>();
  return { ...actual, loadData: (...args: unknown[]) => mockLoadData(...args) };
});

const makeDataset = (): Dataset =>
  ({ embeddableId: 'e1', datasetId: 'ds1', inputName: 'dataset', variableValues: {} }) as Dataset;

const makeMeasure = (name = 'revenue', aggType?: string): Measure =>
  ({
    name,
    title: name,
    nativeType: 'number',
    inputs: {},
    meta: aggType ? { aggType } : {},
  }) as unknown as Measure;

beforeEach(() => mockLoadData.mockClear());

describe('isAdditiveMeasure / getAdditiveMeasures', () => {
  it('treats sum, count and undefined aggType as additive', () => {
    expect(isAdditiveMeasure(makeMeasure('a', 'sum'))).toBe(true);
    expect(isAdditiveMeasure(makeMeasure('b', 'count'))).toBe(true);
    expect(isAdditiveMeasure(makeMeasure('c'))).toBe(true); // no aggType → legacy sum
  });

  it('treats avg/min/max/median/countDistinct as non-additive', () => {
    for (const aggType of ['avg', 'min', 'max', 'median', 'countDistinct']) {
      expect(isAdditiveMeasure(makeMeasure('m', aggType))).toBe(false);
    }
  });

  it('filters a mixed list down to the additive measures', () => {
    const sum = makeMeasure('revenue', 'sum');
    const avg = makeMeasure('avg_order', 'avg');
    expect(getAdditiveMeasures([sum, avg])).toEqual([sum]);
  });
});

describe('getTopItemsOrderBy', () => {
  it('orders by the first measure descending', () => {
    const measure = makeMeasure('revenue');
    expect(getTopItemsOrderBy([measure])).toEqual([{ property: measure, direction: 'desc' }]);
  });

  it('returns an empty array when there are no measures', () => {
    expect(getTopItemsOrderBy([])).toEqual([]);
  });
});

describe('otherTotalLoadDataArgs', () => {
  it('selects only the additive measures with no dimension', () => {
    const dataset = makeDataset();
    const sum = makeMeasure('revenue', 'sum');
    const avg = makeMeasure('avg_order', 'avg');

    const args = otherTotalLoadDataArgs({ dataset, measures: [sum, avg], timezone: 'UTC' });

    expect(args).toEqual({ from: dataset, select: [sum], timezone: 'UTC' });
  });

  it('returns undefined when there are no additive measures', () => {
    const args = otherTotalLoadDataArgs({
      dataset: makeDataset(),
      measures: [makeMeasure('avg_order', 'avg')],
    });
    expect(args).toBeUndefined();
  });

  it('forwards filters when provided', () => {
    const dataset = makeDataset();
    const sum = makeMeasure('revenue', 'sum');
    const filters = [{ property: sum, operator: 'gt' as const, value: 0 }];

    const args = otherTotalLoadDataArgs({ dataset, measures: [sum], filters });

    expect(args?.filters).toEqual(filters);
  });
});

describe('loadOtherTotal', () => {
  it('does not query when maxItems is not set', () => {
    const result = loadOtherTotal({
      dataset: makeDataset(),
      measures: [makeMeasure('revenue', 'sum')],
    });
    expect(result).toBeUndefined();
    expect(mockLoadData).not.toHaveBeenCalled();
  });

  it('does not query when there are no additive measures', () => {
    const result = loadOtherTotal({
      dataset: makeDataset(),
      measures: [makeMeasure('avg_order', 'avg')],
      maxItems: 5,
    });
    expect(result).toBeUndefined();
    expect(mockLoadData).not.toHaveBeenCalled();
  });

  it('issues the grand-total query when active', () => {
    loadOtherTotal({
      dataset: makeDataset(),
      measures: [makeMeasure('revenue', 'sum')],
      maxItems: 5,
      timezone: 'UTC',
    });
    expect(mockLoadData).toHaveBeenCalledTimes(1);
  });
});

describe('isResultTruncated', () => {
  it('uses server total when present', () => {
    expect(isResultTruncated({ isLoading: false, data: [{}, {}], total: 8 })).toBe(true);
    expect(isResultTruncated({ isLoading: false, data: [{}, {}], total: 2 })).toBe(false);
  });

  it('falls back to comparing returned length against the limit', () => {
    expect(isResultTruncated({ isLoading: false, data: [{}, {}, {}] }, 3)).toBe(true);
    expect(isResultTruncated({ isLoading: false, data: [{}, {}] }, 3)).toBe(false);
  });

  it('is false when there is no total and no limit', () => {
    expect(isResultTruncated({ isLoading: false, data: [{}] })).toBe(false);
  });
});

describe('getMeasureTotals', () => {
  it('reads full-dataset totals for additive measures from the single-row response', () => {
    const sum = makeMeasure('value', 'sum');
    const results: DataResponse = { isLoading: false, data: [{ value: '951515' }] };
    expect(getMeasureTotals(results, [sum])).toEqual({ value: 951515 });
  });

  it('omits non-additive and non-numeric measures', () => {
    const sum = makeMeasure('value', 'sum');
    const avg = makeMeasure('avg_order', 'avg');
    const results: DataResponse = { isLoading: false, data: [{ value: '100', avg_order: '20' }] };
    expect(getMeasureTotals(results, [sum, avg])).toEqual({ value: 100 });
  });

  it('returns an empty object when the response has no rows', () => {
    expect(getMeasureTotals({ isLoading: false, data: [] }, [makeMeasure('value', 'sum')])).toEqual(
      {},
    );
    expect(getMeasureTotals(undefined, [makeMeasure('value', 'sum')])).toEqual({});
  });
});
