import type { Dataset, Dimension, Measure } from '@embeddable.com/core';
import {
  getLimit,
  shouldGetTopItems,
  loadDataResultsAxisOrderArgs,
  loadDataResultsArgs,
  getAxisOrderCacheKey,
  getCachedAxisOrder,
} from './bars.loadData.utils.new';

const makeDataset = (): Dataset =>
  ({ embeddableId: 'e1', datasetId: 'ds1', inputName: 'dataset', variableValues: {} }) as Dataset;

const makeDimension = (name = 'category'): Dimension =>
  ({ name, title: 'Category', nativeType: 'string', inputs: {} }) as unknown as Dimension;

const makeMeasure = (name = 'revenue'): Measure =>
  ({ name, title: 'Revenue', nativeType: 'number', inputs: {} }) as unknown as Measure;

describe('getLimit', () => {
  it('returns the value for a positive integer', () => {
    expect(getLimit(5)).toBe(5);
  });

  it('returns the value for 1', () => {
    expect(getLimit(1)).toBe(1);
  });

  it('returns undefined for 0', () => {
    expect(getLimit(0)).toBeUndefined();
  });

  it('returns undefined for negative numbers', () => {
    expect(getLimit(-3)).toBeUndefined();
  });

  it('returns undefined for floats', () => {
    expect(getLimit(2.5)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(getLimit(undefined)).toBeUndefined();
  });

  it('returns undefined for NaN', () => {
    expect(getLimit(NaN)).toBeUndefined();
  });
});

describe('shouldGetTopItems', () => {
  it('returns true when sort direction is asc', () => {
    expect(shouldGetTopItems('asc', undefined)).toBe(true);
  });

  it('returns true when sort direction is desc', () => {
    expect(shouldGetTopItems('desc', undefined)).toBe(true);
  });

  it('returns true when limit is set', () => {
    expect(shouldGetTopItems(undefined, 5)).toBe(true);
  });

  it('returns true when both are set', () => {
    expect(shouldGetTopItems('desc', 10)).toBe(true);
  });

  it('returns false when neither is set', () => {
    expect(shouldGetTopItems(undefined, undefined)).toBe(false);
  });

  it('returns false for invalid limit only', () => {
    expect(shouldGetTopItems(undefined, 0)).toBe(false);
  });
});

describe('loadDataResultsAxisOrderArgs', () => {
  it('builds correct request with desc sort and limit', () => {
    const result = loadDataResultsAxisOrderArgs({
      dataset: makeDataset(),
      axis: makeDimension(),
      measure: makeMeasure(),
      sortDirection: 'desc',
      limit: 5,
    });

    expect(result.from).toEqual(makeDataset());
    expect(result.select).toEqual([makeDimension(), makeMeasure()]);
    expect(result.orderBy).toEqual([{ property: makeMeasure(), direction: 'desc' }]);
    expect(result.limit).toBe(5);
  });

  it('defaults to desc when only limit is provided', () => {
    const result = loadDataResultsAxisOrderArgs({
      dataset: makeDataset(),
      axis: makeDimension(),
      measure: makeMeasure(),
      sortDirection: undefined,
      limit: 3,
    });

    expect(result.orderBy).toEqual([{ property: makeMeasure(), direction: 'desc' }]);
    expect(result.limit).toBe(3);
  });

  it('uses asc direction', () => {
    const result = loadDataResultsAxisOrderArgs({
      dataset: makeDataset(),
      axis: makeDimension(),
      measure: makeMeasure(),
      sortDirection: 'asc',
      limit: undefined,
    });

    expect(result.orderBy).toEqual([{ property: makeMeasure(), direction: 'asc' }]);
    expect(result.limit).toBeUndefined();
  });

  it('omits limit when limit is invalid', () => {
    const result = loadDataResultsAxisOrderArgs({
      dataset: makeDataset(),
      axis: makeDimension(),
      measure: makeMeasure(),
      sortDirection: 'desc',
      limit: -1,
    });

    expect(result.limit).toBeUndefined();
  });
});

describe('loadDataResultsArgs', () => {
  it('builds unfiltered request without axisOrder', () => {
    const result = loadDataResultsArgs({
      dataset: makeDataset(),
      axis: makeDimension('xAxis'),
      groupBy: makeDimension('groupBy'),
      measure: makeMeasure(),
      limit: 1000,
    });

    expect(result.from).toEqual(makeDataset());
    expect(result.select).toEqual([
      makeDimension('xAxis'),
      makeDimension('groupBy'),
      makeMeasure(),
    ]);
    expect(result.limit).toBe(1000);
    expect(result.filters).toBeUndefined();
  });

  it('builds unfiltered request when axisOrder is empty', () => {
    const result = loadDataResultsArgs({
      dataset: makeDataset(),
      axis: makeDimension('xAxis'),
      groupBy: makeDimension('groupBy'),
      measure: makeMeasure(),
      limit: 1000,
      axisOrder: [],
    });

    expect(result.filters).toBeUndefined();
  });

  it('builds filtered request with axisOrder', () => {
    const axis = makeDimension('country');
    const result = loadDataResultsArgs({
      dataset: makeDataset(),
      axis,
      groupBy: makeDimension('region'),
      measure: makeMeasure(),
      limit: 1000,
      axisOrder: ['FR', 'DE', 'PL'],
    });

    expect(result.filters).toEqual([
      { property: axis, operator: 'equals', value: ['FR', 'DE', 'PL'] },
    ]);
    expect(result.limit).toBe(1000);
  });
});

describe('getAxisOrderCacheKey', () => {
  it('returns undefined when no sort or limit', () => {
    expect(
      getAxisOrderCacheKey({
        dataset: makeDataset(),
        axis: makeDimension(),
        measure: makeMeasure(),
        sortDirection: undefined,
        limit: undefined,
      }),
    ).toBeUndefined();
  });

  it('returns a string key when sort direction is set', () => {
    const key = getAxisOrderCacheKey({
      dataset: makeDataset(),
      axis: makeDimension(),
      measure: makeMeasure(),
      sortDirection: 'desc',
      limit: 5,
    });

    expect(typeof key).toBe('string');
    expect(key!.length).toBeGreaterThan(0);
  });

  it('returns a string key when only limit is set', () => {
    const key = getAxisOrderCacheKey({
      dataset: makeDataset(),
      axis: makeDimension(),
      measure: makeMeasure(),
      sortDirection: undefined,
      limit: 3,
    });

    expect(typeof key).toBe('string');
  });
});

describe('getCachedAxisOrder', () => {
  it('returns undefined when cacheKey is undefined', () => {
    expect(
      getCachedAxisOrder(undefined, { axisOrderCacheKey: 'key', axisOrder: ['a'] }),
    ).toBeUndefined();
  });

  it('returns undefined when cacheKey does not match state', () => {
    expect(
      getCachedAxisOrder('key-2', { axisOrderCacheKey: 'key-1', axisOrder: ['a'] }),
    ).toBeUndefined();
  });

  it('returns axisOrder when cacheKey matches', () => {
    expect(
      getCachedAxisOrder('key-1', { axisOrderCacheKey: 'key-1', axisOrder: ['a', 'b'] }),
    ).toEqual(['a', 'b']);
  });

  it('returns undefined when state is undefined', () => {
    expect(getCachedAxisOrder('key-1', undefined)).toBeUndefined();
  });
});
