import type { DataResponse, Dataset, Dimension, Measure } from '@embeddable.com/core';
import { vi } from 'vitest';
import {
  getAdditiveMeasures,
  getChartCardData,
  getFirstMeasureOrderBy,
  getMeasureTotals,
  loadDataOtherTotal,
} from './charts.other.loadData.utils';

const mockLoadData = vi.fn(
  (...args: unknown[]) => ({ __request: args[0] }) as unknown as DataResponse,
);
vi.mock('@embeddable.com/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@embeddable.com/core')>();
  return { ...actual, loadData: (...args: unknown[]) => mockLoadData(...args) };
});

vi.mock('../../theme/i18n/i18n', () => ({
  i18n: { t: (key: string) => `t(${key})` },
}));

const makeDataset = (): Dataset =>
  ({ embeddableId: 'e1', datasetId: 'ds1', inputName: 'dataset', variableValues: {} }) as Dataset;

const makeDimension = (name = 'category'): Dimension =>
  ({ name, __type__: 'dimension', inputs: {} }) as unknown as Dimension;

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

describe('getChartCardData', () => {
  const dimension = makeDimension('category');
  const measure = makeMeasure('value', 'sum');
  const results: DataResponse = {
    isLoading: false,
    data: [
      { category: 'US', value: '465235' },
      { category: 'CA', value: '138807' },
      { category: 'AU', value: '81337' },
      { category: 'GB', value: '72056' },
      { category: 'ES', value: '70956' },
    ],
  };

  it('returns a loading response while the grand-total query is loading', () => {
    const cardData = getChartCardData({
      results,
      resultsOtherTotal: { isLoading: true },
      dimension,
      measures: [measure],
      maxItems: 3,
    });
    expect(cardData.isLoading).toBe(true);
    expect(cardData.data).toBeUndefined();
  });

  it('appends the Other row (from full-dataset totals) so the export matches the chart', () => {
    const cardData = getChartCardData({
      results,
      resultsOtherTotal: { isLoading: false, data: [{ value: '951515' }] },
      dimension,
      measures: [measure],
      maxItems: 3,
    });
    // top-2 shown individually + a single "Other" row
    expect(cardData.data).toHaveLength(3);
    expect(cardData.data?.[2]?.category).toBe('t(common.other)');
    // Other = 951515 - (465235 + 138807) = 347473
    expect(cardData.data?.[2]?.value).toBe(347473);
  });

  it('returns the results unchanged when there is no Other bucket (no maxItems)', () => {
    const cardData = getChartCardData({
      results,
      resultsOtherTotal: { isLoading: false, data: [{ value: '951515' }] },
      dimension,
      measures: [measure],
    });
    expect(cardData.data).toBe(results.data);
  });

  it('falls back to the returned tail when there is no grand-total query', () => {
    const cardData = getChartCardData({
      results,
      resultsOtherTotal: undefined,
      dimension,
      measures: [measure],
      maxItems: 3,
    });
    expect(cardData.data).toHaveLength(3);
    // no totals → Other from the returned tail: AU + GB + ES = 224349
    expect(cardData.data?.[2]?.value).toBe(224349);
  });

  it('does not get stuck loading when the grand-total query errored', () => {
    const cardData = getChartCardData({
      results,
      resultsOtherTotal: { isLoading: false, data: undefined, error: 'boom' },
      dimension,
      measures: [measure],
      maxItems: 3,
    });
    expect(cardData.isLoading).toBe(false);
    expect(cardData.data).toHaveLength(3);
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
