import type { Dataset, Dimension, Measure } from '@embeddable.com/core';
import {
  parseSortDirection,
  isValidLimit,
  hasSortOrLimit,
  loadDataTotalsArgs,
  loadDataMainArgs,
} from './bars.loadData.utils';

const makeDataset = (): Dataset =>
  ({ embeddableId: 'e1', datasetId: 'ds1', inputName: 'dataset', variableValues: {} }) as Dataset;

const makeDimension = (name = 'category'): Dimension =>
  ({ name, title: 'Category', nativeType: 'string', inputs: {} }) as unknown as Dimension;

const makeMeasure = (name = 'revenue'): Measure =>
  ({ name, title: 'Revenue', nativeType: 'number', inputs: {} }) as unknown as Measure;

describe('parseSortDirection', () => {
  it('maps "Ascending" to "asc"', () => {
    expect(parseSortDirection('Ascending')).toBe('asc');
  });

  it('maps "Descending" to "desc"', () => {
    expect(parseSortDirection('Descending')).toBe('desc');
  });

  it('returns undefined for undefined input', () => {
    expect(parseSortDirection(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(parseSortDirection('')).toBeUndefined();
  });

  it('returns undefined for unrecognized value', () => {
    expect(parseSortDirection('random')).toBeUndefined();
  });
});

describe('isValidLimit', () => {
  it('returns true for a positive integer', () => {
    expect(isValidLimit(5)).toBe(true);
  });

  it('returns true for 1', () => {
    expect(isValidLimit(1)).toBe(true);
  });

  it('returns false for 0', () => {
    expect(isValidLimit(0)).toBe(false);
  });

  it('returns false for negative numbers', () => {
    expect(isValidLimit(-3)).toBe(false);
  });

  it('returns false for floats', () => {
    expect(isValidLimit(2.5)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidLimit(undefined)).toBe(false);
  });

  it('returns false for NaN', () => {
    expect(isValidLimit(NaN)).toBe(false);
  });
});

describe('hasSortOrLimit', () => {
  it('returns true when sort direction is set', () => {
    expect(hasSortOrLimit('Ascending', undefined)).toBe(true);
  });

  it('returns true when limit is set', () => {
    expect(hasSortOrLimit(undefined, 5)).toBe(true);
  });

  it('returns true when both are set', () => {
    expect(hasSortOrLimit('Descending', 10)).toBe(true);
  });

  it('returns false when neither is set', () => {
    expect(hasSortOrLimit(undefined, undefined)).toBe(false);
  });

  it('returns false for invalid sort and invalid limit', () => {
    expect(hasSortOrLimit('', 0)).toBe(false);
  });

  it('returns false for unrecognized sort and negative limit', () => {
    expect(hasSortOrLimit('random', -1)).toBe(false);
  });
});

describe('loadDataTotalsArgs', () => {
  it('builds correct request with sort and limit', () => {
    const result = loadDataTotalsArgs(
      makeDataset(),
      makeDimension(),
      makeMeasure(),
      'Descending',
      5,
    );

    expect(result.from).toEqual(makeDataset());
    expect(result.select).toEqual([makeDimension(), makeMeasure()]);
    expect(result.orderBy).toEqual([{ property: makeMeasure(), direction: 'desc' }]);
    expect(result.limit).toBe(5);
  });

  it('defaults to "desc" when only limit is provided', () => {
    const result = loadDataTotalsArgs(makeDataset(), makeDimension(), makeMeasure(), undefined, 3);

    expect(result.orderBy).toEqual([{ property: makeMeasure(), direction: 'desc' }]);
    expect(result.limit).toBe(3);
  });

  it('uses sort direction with no limit', () => {
    const result = loadDataTotalsArgs(
      makeDataset(),
      makeDimension(),
      makeMeasure(),
      'Ascending',
      undefined,
    );

    expect(result.orderBy).toEqual([{ property: makeMeasure(), direction: 'asc' }]);
    expect(result.limit).toBeUndefined();
  });

  it('omits limit when limit is invalid', () => {
    const result = loadDataTotalsArgs(
      makeDataset(),
      makeDimension(),
      makeMeasure(),
      'Descending',
      -1,
    );

    expect(result.limit).toBeUndefined();
  });
});

describe('loadDataMainArgs', () => {
  it('builds unfiltered request without topAxisValues', () => {
    const result = loadDataMainArgs(
      makeDataset(),
      makeDimension('xAxis'),
      makeDimension('groupBy'),
      makeMeasure(),
      1000,
    );

    expect(result.from).toEqual(makeDataset());
    expect(result.select).toEqual([
      makeDimension('xAxis'),
      makeDimension('groupBy'),
      makeMeasure(),
    ]);
    expect(result.limit).toBe(1000);
    expect(result.filters).toBeUndefined();
  });

  it('builds unfiltered request when topAxisValues is empty', () => {
    const result = loadDataMainArgs(
      makeDataset(),
      makeDimension('xAxis'),
      makeDimension('groupBy'),
      makeMeasure(),
      1000,
      [],
    );

    expect(result.filters).toBeUndefined();
  });

  it('builds filtered request with topAxisValues', () => {
    const axis = makeDimension('country');
    const result = loadDataMainArgs(
      makeDataset(),
      axis,
      makeDimension('region'),
      makeMeasure(),
      1000,
      ['FR', 'DE', 'PL'],
    );

    expect(result.filters).toEqual([
      { property: axis, operator: 'equals', value: ['FR', 'DE', 'PL'] },
    ]);
    expect(result.limit).toBe(1000);
  });
});
