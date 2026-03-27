import type { Dimension, Measure } from '@embeddable.com/core';
import {
  getValidLimit,
  hasSortOrLimit,
  getSortDirection,
  buildTotalsRequest,
  buildAxisTotalFilter,
  getTotalsRequestKey,
} from './bars.sort.utils';

const makeDimension = (name = 'category'): Dimension =>
  ({ name, title: name, nativeType: 'string', inputs: {} }) as unknown as Dimension;

const makeMeasure = (name = 'revenue'): Measure =>
  ({ name, title: name, nativeType: 'number', inputs: {} }) as unknown as Measure;

describe('getValidLimit', () => {
  it('returns undefined for undefined input', () => {
    expect(getValidLimit(undefined)).toBeUndefined();
  });

  it('returns undefined for zero', () => {
    expect(getValidLimit(0)).toBeUndefined();
  });

  it('returns undefined for negative numbers', () => {
    expect(getValidLimit(-5)).toBeUndefined();
  });

  it('returns the integer value for positive integers', () => {
    expect(getValidLimit(10)).toBe(10);
  });

  it('floors positive decimals to an integer', () => {
    expect(getValidLimit(3.7)).toBe(3);
  });

  it('returns undefined when a decimal floors to zero', () => {
    expect(getValidLimit(0.5)).toBeUndefined();
  });

  it('returns undefined for NaN', () => {
    expect(getValidLimit(NaN)).toBeUndefined();
  });
});

describe('hasSortOrLimit', () => {
  it('returns false when neither sort nor limit is set', () => {
    expect(hasSortOrLimit(undefined, undefined)).toBe(false);
  });

  it('returns true when sort is set', () => {
    expect(hasSortOrLimit('Ascending', undefined)).toBe(true);
  });

  it('returns true when a valid limit is set', () => {
    expect(hasSortOrLimit(undefined, 5)).toBe(true);
  });

  it('returns false when limit is invalid', () => {
    expect(hasSortOrLimit(undefined, -1)).toBe(false);
    expect(hasSortOrLimit(undefined, 0)).toBe(false);
  });

  it('returns true when both sort and limit are set', () => {
    expect(hasSortOrLimit('Descending', 10)).toBe(true);
  });
});

describe('getSortDirection', () => {
  it('returns "asc" for "Ascending"', () => {
    expect(getSortDirection('Ascending')).toBe('asc');
  });

  it('returns "desc" for "Descending"', () => {
    expect(getSortDirection('Descending')).toBe('desc');
  });

  it('defaults to "desc" when undefined', () => {
    expect(getSortDirection(undefined)).toBe('desc');
  });

  it('defaults to "desc" for unrecognized values', () => {
    expect(getSortDirection('something-else')).toBe('desc');
  });
});

describe('buildTotalsRequest', () => {
  const dataset = 'test-dataset' as never;
  const axisDimension = makeDimension('xAxis');
  const measure = makeMeasure('revenue');

  it('returns undefined when neither sort nor limit is set', () => {
    expect(buildTotalsRequest({ dataset, axisDimension, measure })).toBeUndefined();
  });

  it('builds a request with sort only', () => {
    const result = buildTotalsRequest({
      dataset,
      axisDimension,
      measure,
      sortByAxisTotal: 'Ascending',
    });

    expect(result).toEqual({
      from: dataset,
      select: [axisDimension, measure],
      orderBy: [{ property: measure, direction: 'asc' }],
      limit: undefined,
    });
  });

  it('builds a request with limit only, defaulting sort to desc', () => {
    const result = buildTotalsRequest({
      dataset,
      axisDimension,
      measure,
      limitAxisItems: 5,
    });

    expect(result).toEqual({
      from: dataset,
      select: [axisDimension, measure],
      orderBy: [{ property: measure, direction: 'desc' }],
      limit: 5,
    });
  });

  it('builds a request with both sort and limit', () => {
    const result = buildTotalsRequest({
      dataset,
      axisDimension,
      measure,
      sortByAxisTotal: 'Ascending',
      limitAxisItems: 3,
    });

    expect(result).toEqual({
      from: dataset,
      select: [axisDimension, measure],
      orderBy: [{ property: measure, direction: 'asc' }],
      limit: 3,
    });
  });

  it('floors decimal limit values', () => {
    const result = buildTotalsRequest({
      dataset,
      axisDimension,
      measure,
      sortByAxisTotal: 'Descending',
      limitAxisItems: 7.9,
    });

    expect(result?.limit).toBe(7);
  });

  it('ignores invalid limit values', () => {
    const result = buildTotalsRequest({
      dataset,
      axisDimension,
      measure,
      sortByAxisTotal: 'Descending',
      limitAxisItems: -3,
    });

    expect(result?.limit).toBeUndefined();
  });
});

describe('buildAxisTotalFilter', () => {
  const dimension = makeDimension('category');

  it('returns undefined when axisTotalValues is undefined', () => {
    expect(buildAxisTotalFilter(dimension, undefined)).toBeUndefined();
  });

  it('returns undefined when axisTotalValues is empty', () => {
    expect(buildAxisTotalFilter(dimension, [])).toBeUndefined();
  });

  it('returns an equals filter for non-empty values', () => {
    const values = ['A', 'B', 'C'];
    const result = buildAxisTotalFilter(dimension, values);

    expect(result).toEqual([{ property: dimension, operator: 'equals', value: values }]);
  });
});

describe('getTotalsRequestKey', () => {
  it('produces a stable key for the same parameters', () => {
    const params = {
      sortByAxisTotal: 'Descending',
      limitAxisItems: 5,
      axisDimensionName: 'country',
      measureName: 'revenue',
    };

    expect(getTotalsRequestKey(params)).toBe(getTotalsRequestKey(params));
  });

  it('produces different keys when sort changes', () => {
    const base = { limitAxisItems: 5, axisDimensionName: 'country', measureName: 'revenue' };

    expect(getTotalsRequestKey({ ...base, sortByAxisTotal: 'Ascending' })).not.toBe(
      getTotalsRequestKey({ ...base, sortByAxisTotal: 'Descending' }),
    );
  });

  it('produces different keys when limit changes', () => {
    const base = {
      sortByAxisTotal: 'Descending',
      axisDimensionName: 'country',
      measureName: 'revenue',
    };

    expect(getTotalsRequestKey({ ...base, limitAxisItems: 3 })).not.toBe(
      getTotalsRequestKey({ ...base, limitAxisItems: 10 }),
    );
  });

  it('produces different keys when dimension changes', () => {
    const base = { sortByAxisTotal: 'Descending', limitAxisItems: 5, measureName: 'revenue' };

    expect(getTotalsRequestKey({ ...base, axisDimensionName: 'country' })).not.toBe(
      getTotalsRequestKey({ ...base, axisDimensionName: 'city' }),
    );
  });

  it('produces different keys when measure changes', () => {
    const base = {
      sortByAxisTotal: 'Descending',
      limitAxisItems: 5,
      axisDimensionName: 'country',
    };

    expect(getTotalsRequestKey({ ...base, measureName: 'revenue' })).not.toBe(
      getTotalsRequestKey({ ...base, measureName: 'cost' }),
    );
  });

  it('handles undefined sort and limit', () => {
    const key = getTotalsRequestKey({
      axisDimensionName: 'country',
      measureName: 'revenue',
    });

    expect(key).toBe('::country:revenue');
  });

  it('floors decimal limits in the key', () => {
    const base = {
      sortByAxisTotal: 'Descending',
      axisDimensionName: 'country',
      measureName: 'revenue',
    };

    expect(getTotalsRequestKey({ ...base, limitAxisItems: 3.7 })).toBe(
      getTotalsRequestKey({ ...base, limitAxisItems: 3 }),
    );
  });
});
