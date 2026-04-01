import type { Dataset, Dimension, Measure } from '@embeddable.com/core';
import {
  toOrderDirection,
  getLimit,
  shouldGetTopItems,
  buildAxisOrderArgs,
  buildResultsArgs,
} from './bars.loadData.utils';

const makeDataset = (): Dataset =>
  ({ embeddableId: 'e1', datasetId: 'ds1', inputName: 'dataset', variableValues: {} }) as Dataset;

const makeDimension = (name = 'category'): Dimension =>
  ({ name, title: 'Category', nativeType: 'string', inputs: {} }) as unknown as Dimension;

const makeMeasure = (name = 'revenue'): Measure =>
  ({ name, title: 'Revenue', nativeType: 'number', inputs: {} }) as unknown as Measure;

describe('toOrderDirection', () => {
  it('maps "Ascending" to "asc"', () => {
    expect(toOrderDirection('Ascending')).toBe('asc');
  });

  it('maps "Descending" to "desc"', () => {
    expect(toOrderDirection('Descending')).toBe('desc');
  });

  it('returns undefined for undefined', () => {
    expect(toOrderDirection(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(toOrderDirection('')).toBeUndefined();
  });

  it('returns undefined for unrecognized values', () => {
    expect(toOrderDirection('random')).toBeUndefined();
  });
});

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
  it('returns true when sort direction is Ascending', () => {
    expect(shouldGetTopItems('Ascending', undefined)).toBe(true);
  });

  it('returns true when sort direction is Descending', () => {
    expect(shouldGetTopItems('Descending', undefined)).toBe(true);
  });

  it('returns true when limit is set', () => {
    expect(shouldGetTopItems(undefined, 5)).toBe(true);
  });

  it('returns true when both are set', () => {
    expect(shouldGetTopItems('Descending', 10)).toBe(true);
  });

  it('returns false when neither is set', () => {
    expect(shouldGetTopItems(undefined, undefined)).toBe(false);
  });

  it('returns false for invalid sort and invalid limit', () => {
    expect(shouldGetTopItems('', 0)).toBe(false);
  });

  it('returns false for unrecognized sort and negative limit', () => {
    expect(shouldGetTopItems('random', -1)).toBe(false);
  });
});

describe('buildAxisOrderArgs', () => {
  it('builds correct request with Descending sort and limit', () => {
    const result = buildAxisOrderArgs({
      dataset: makeDataset(),
      axis: makeDimension(),
      measure: makeMeasure(),
      sortDirection: 'Descending',
      limit: 5,
    });

    expect(result.from).toEqual(makeDataset());
    expect(result.select).toEqual([makeDimension(), makeMeasure()]);
    expect(result.orderBy).toEqual([{ property: makeMeasure(), direction: 'desc' }]);
    expect(result.limit).toBe(5);
  });

  it('defaults to "desc" when only limit is provided', () => {
    const result = buildAxisOrderArgs({
      dataset: makeDataset(),
      axis: makeDimension(),
      measure: makeMeasure(),
      sortDirection: undefined,
      limit: 3,
    });

    expect(result.orderBy).toEqual([{ property: makeMeasure(), direction: 'desc' }]);
    expect(result.limit).toBe(3);
  });

  it('maps Ascending to asc direction', () => {
    const result = buildAxisOrderArgs({
      dataset: makeDataset(),
      axis: makeDimension(),
      measure: makeMeasure(),
      sortDirection: 'Ascending',
      limit: undefined,
    });

    expect(result.orderBy).toEqual([{ property: makeMeasure(), direction: 'asc' }]);
    expect(result.limit).toBeUndefined();
  });

  it('omits limit when limit is invalid', () => {
    const result = buildAxisOrderArgs({
      dataset: makeDataset(),
      axis: makeDimension(),
      measure: makeMeasure(),
      sortDirection: 'Descending',
      limit: -1,
    });

    expect(result.limit).toBeUndefined();
  });
});

describe('buildResultsArgs', () => {
  it('builds unfiltered request without axisOrder', () => {
    const result = buildResultsArgs({
      dataset: makeDataset(),
      axis: makeDimension('xAxis'),
      groupBy: makeDimension('groupBy'),
      measure: makeMeasure(),
      maxResults: 1000,
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
    const result = buildResultsArgs({
      dataset: makeDataset(),
      axis: makeDimension('xAxis'),
      groupBy: makeDimension('groupBy'),
      measure: makeMeasure(),
      maxResults: 1000,
      axisOrder: [],
    });

    expect(result.filters).toBeUndefined();
  });

  it('builds filtered request with axisOrder', () => {
    const axis = makeDimension('country');
    const result = buildResultsArgs({
      dataset: makeDataset(),
      axis,
      groupBy: makeDimension('region'),
      measure: makeMeasure(),
      maxResults: 1000,
      axisOrder: ['FR', 'DE', 'PL'],
    });

    expect(result.filters).toEqual([
      { property: axis, operator: 'equals', value: ['FR', 'DE', 'PL'] },
    ]);
    expect(result.limit).toBe(1000);
  });
});
