import type { DataResponse, Dataset, Measure } from '@embeddable.com/core';
import { vi } from 'vitest';
import {
  getAdditiveMeasures,
  getFirstMeasureOrderBy,
  getMeasureTotals,
  getResultsForCard,
  loadDataOtherTotal,
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

describe('getAdditiveMeasures', () => {
  it('keeps sum, count and undefined aggType (legacy sum)', () => {
    const sum = makeMeasure('a', 'sum');
    const count = makeMeasure('b', 'count');
    const legacy = makeMeasure('c');
    expect(getAdditiveMeasures([sum, count, legacy])).toEqual([sum, count, legacy]);
  });

  it('drops avg/min/max/median/countDistinct', () => {
    const measures = ['avg', 'min', 'max', 'median', 'countDistinct'].map((aggType) =>
      makeMeasure('m', aggType),
    );
    expect(getAdditiveMeasures(measures)).toEqual([]);
  });

  it('filters a mixed list down to the additive measures', () => {
    const sum = makeMeasure('revenue', 'sum');
    const avg = makeMeasure('avg_order', 'avg');
    expect(getAdditiveMeasures([sum, avg])).toEqual([sum]);
  });
});

describe('getFirstMeasureOrderBy', () => {
  it('orders by the first measure descending', () => {
    const measure = makeMeasure('revenue');
    expect(getFirstMeasureOrderBy([measure])).toEqual([{ property: measure, direction: 'desc' }]);
  });

  it('returns an empty array when there are no measures', () => {
    expect(getFirstMeasureOrderBy([])).toEqual([]);
  });
});

describe('loadDataOtherTotal', () => {
  it('does not query when maxItems is not set', () => {
    const result = loadDataOtherTotal({
      dataset: makeDataset(),
      measures: [makeMeasure('revenue', 'sum')],
    });
    expect(result).toBeUndefined();
    expect(mockLoadData).not.toHaveBeenCalled();
  });

  it('does not query when there are no additive measures', () => {
    const result = loadDataOtherTotal({
      dataset: makeDataset(),
      measures: [makeMeasure('avg_order', 'avg')],
      maxItems: 5,
    });
    expect(result).toBeUndefined();
    expect(mockLoadData).not.toHaveBeenCalled();
  });

  it('queries the additive measures with no dimension when active', () => {
    const dataset = makeDataset();
    const sum = makeMeasure('revenue', 'sum');
    const avg = makeMeasure('avg_order', 'avg');

    loadDataOtherTotal({ dataset, measures: [sum, avg], maxItems: 5, timezone: 'UTC' });

    expect(mockLoadData).toHaveBeenCalledTimes(1);
    expect(mockLoadData).toHaveBeenCalledWith({ from: dataset, select: [sum], timezone: 'UTC' });
  });
});

describe('getResultsForCard', () => {
  const results: DataResponse = { isLoading: false, data: [{ value: '1' }] };

  it('returns the results unchanged when no grand-total query is expected', () => {
    expect(getResultsForCard(results, undefined)).toBe(results);
  });

  it('returns a loading result while the grand-total query is loading', () => {
    expect(getResultsForCard(results, { isLoading: true })).toEqual({
      isLoading: true,
      data: undefined,
    });
  });

  it('returns a loading result when the query resolved but totals have not arrived', () => {
    expect(getResultsForCard(results, { isLoading: false, data: undefined })).toEqual({
      isLoading: true,
      data: undefined,
    });
  });

  it('returns the results once the totals have resolved', () => {
    expect(getResultsForCard(results, { isLoading: false, data: [{ value: '100' }] })).toBe(
      results,
    );
  });

  it('returns the results when the grand-total query errored (avoids a stuck loading state)', () => {
    expect(getResultsForCard(results, { isLoading: false, data: undefined, error: 'boom' })).toBe(
      results,
    );
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
