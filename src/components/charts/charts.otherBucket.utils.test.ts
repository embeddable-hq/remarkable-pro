import type { Dataset, DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { vi } from 'vitest';
import {
  getOtherBucketHeadCount,
  getOtherBucketHeadInfo,
  getOtherBucketCacheKey,
  getCachedOtherBucketState,
  getOtherBucketAggregateArgs,
  loadOtherBucketAggregate,
} from './charts.otherBucket.utils';

const mockLoadData = vi.fn();
vi.mock('@embeddable.com/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@embeddable.com/core')>();
  return { ...actual, loadData: (...args: unknown[]) => mockLoadData(...args) };
});

const makeDataset = (): Dataset =>
  ({ embeddableId: 'e1', datasetId: 'ds1', inputName: 'dataset', variableValues: {} }) as Dataset;

const makeDimension = (name = 'category'): Dimension =>
  ({ name, title: 'Category', nativeType: 'string', inputs: {} }) as unknown as Dimension;

const makeMeasure = (name = 'revenue'): Measure =>
  ({ name, title: 'Revenue', nativeType: 'number', inputs: {} }) as unknown as Measure;

describe('getOtherBucketHeadCount', () => {
  it('returns maxItems - 1 for a positive integer', () => {
    expect(getOtherBucketHeadCount(5)).toBe(4);
  });

  it('returns 0 when maxItems is 1', () => {
    expect(getOtherBucketHeadCount(1)).toBe(0);
  });

  it('returns undefined when maxItems is undefined', () => {
    expect(getOtherBucketHeadCount(undefined)).toBeUndefined();
  });

  it('returns undefined when maxItems is 0', () => {
    expect(getOtherBucketHeadCount(0)).toBeUndefined();
  });

  it('returns undefined when maxItems is negative', () => {
    expect(getOtherBucketHeadCount(-3)).toBeUndefined();
  });
});

describe('getOtherBucketHeadInfo', () => {
  const dimension = makeDimension();

  it('is inactive when maxItems is not provided', () => {
    const data = [{ category: 'A' }, { category: 'B' }];
    expect(getOtherBucketHeadInfo(data, dimension, undefined, 1000)).toEqual({
      active: false,
      headValues: [],
    });
  });

  it('is inactive when data fits within maxItems (no bucketing)', () => {
    const data = [{ category: 'A' }, { category: 'B' }];
    expect(getOtherBucketHeadInfo(data, dimension, 5, 1000)).toEqual({
      active: false,
      headValues: [],
    });
  });

  it('is inactive when bucketing applies but the primary call was not truncated', () => {
    const data = Array.from({ length: 10 }, (_, i) => ({ category: `c${i}` }));
    expect(getOtherBucketHeadInfo(data, dimension, 3, 1000)).toEqual({
      active: false,
      headValues: [],
    });
  });

  it('is inactive when maxResults is not provided', () => {
    const data = Array.from({ length: 10 }, (_, i) => ({ category: `c${i}` }));
    expect(getOtherBucketHeadInfo(data, dimension, 3, undefined)).toEqual({
      active: false,
      headValues: [],
    });
  });

  it('is active with the correct head values when bucketing applies and the call was truncated', () => {
    const data = [
      { category: 'A' },
      { category: 'B' },
      { category: 'C' },
      { category: 'D' },
      { category: 'E' },
    ];
    // maxItems=3 -> headCount=2; maxResults=5 -> data.length(5) >= 5 is truncated
    expect(getOtherBucketHeadInfo(data, dimension, 3, 5)).toEqual({
      active: true,
      headValues: ['A', 'B'],
    });
  });

  it('filters out null/undefined dimension values from headValues', () => {
    const data = [
      { category: 'A' },
      { category: null },
      { category: 'C' },
      { category: 'D' },
      { category: 'E' },
    ];
    expect(getOtherBucketHeadInfo(data, dimension, 3, 5)).toEqual({
      active: true,
      headValues: ['A'],
    });
  });

  it('returns an empty headValues array when maxItems is 1 (headCount 0)', () => {
    const data = [{ category: 'A' }, { category: 'B' }, { category: 'C' }];
    expect(getOtherBucketHeadInfo(data, dimension, 1, 3)).toEqual({
      active: true,
      headValues: [],
    });
  });

  it('defaults data to an empty array when undefined', () => {
    expect(getOtherBucketHeadInfo(undefined, dimension, 3, 5)).toEqual({
      active: false,
      headValues: [],
    });
  });
});

describe('getOtherBucketCacheKey', () => {
  it('produces a stable string for the same request and maxItems', () => {
    const request = { from: makeDataset(), select: [makeMeasure()], limit: 1000 };
    const key1 = getOtherBucketCacheKey(request, 5);
    const key2 = getOtherBucketCacheKey(request, 5);
    expect(key1).toBe(key2);
  });

  it('produces different keys for different maxItems', () => {
    const request = { from: makeDataset(), select: [makeMeasure()], limit: 1000 };
    expect(getOtherBucketCacheKey(request, 5)).not.toBe(getOtherBucketCacheKey(request, 6));
  });

  it('produces different keys for different requests', () => {
    const request1 = { from: makeDataset(), select: [makeMeasure('revenue')], limit: 1000 };
    const request2 = { from: makeDataset(), select: [makeMeasure('cost')], limit: 1000 };
    expect(getOtherBucketCacheKey(request1, 5)).not.toBe(getOtherBucketCacheKey(request2, 5));
  });
});

describe('getCachedOtherBucketState', () => {
  it('returns inactive defaults when cacheKey does not match state', () => {
    expect(
      getCachedOtherBucketState('key-2', {
        otherBucketCacheKey: 'key-1',
        otherBucketActive: true,
        otherBucketHeadValues: ['A'],
      }),
    ).toEqual({ active: false, headValues: [] });
  });

  it('returns inactive defaults when state is undefined', () => {
    expect(getCachedOtherBucketState('key-1', undefined)).toEqual({
      active: false,
      headValues: [],
    });
  });

  it('returns the cached state when cacheKey matches', () => {
    expect(
      getCachedOtherBucketState('key-1', {
        otherBucketCacheKey: 'key-1',
        otherBucketActive: true,
        otherBucketHeadValues: ['A', 'B'],
      }),
    ).toEqual({ active: true, headValues: ['A', 'B'] });
  });
});

describe('getOtherBucketAggregateArgs', () => {
  it('builds a guaranteed-empty request when inactive', () => {
    const dataset = makeDataset();
    const dimension = makeDimension();
    const measures = [makeMeasure()];

    const result = getOtherBucketAggregateArgs({
      dataset,
      dimension,
      measures,
      active: false,
      headValues: [],
    });

    expect(result.from).toBe(dataset);
    expect(result.select).toEqual(measures);
    expect(result.limit).toBe(1);
    expect(result.filters).toEqual([{ property: dimension, operator: 'equals', value: [] }]);
  });

  it('builds a notEquals filter excluding head values when active with headValues', () => {
    const dataset = makeDataset();
    const dimension = makeDimension();
    const measures = [makeMeasure()];

    const result = getOtherBucketAggregateArgs({
      dataset,
      dimension,
      measures,
      active: true,
      headValues: ['A', 'B'],
    });

    expect(result.filters).toEqual([
      { property: dimension, operator: 'notEquals', value: ['A', 'B'] },
    ]);
  });

  it('builds an unfiltered aggregate-everything request when active with no headValues', () => {
    const dataset = makeDataset();
    const dimension = makeDimension();
    const measures = [makeMeasure()];

    const result = getOtherBucketAggregateArgs({
      dataset,
      dimension,
      measures,
      active: true,
      headValues: [],
    });

    expect(result.filters).toEqual([]);
  });

  it('passes through timezone', () => {
    const result = getOtherBucketAggregateArgs({
      dataset: makeDataset(),
      dimension: makeDimension(),
      measures: [makeMeasure()],
      active: false,
      headValues: [],
      timezone: 'UTC',
    });

    expect(result.timezone).toBe('UTC');
  });
});

describe('loadOtherBucketAggregate', () => {
  beforeEach(() => mockLoadData.mockReset());

  it('calls loadData with the built request', () => {
    const fakeResponse = { data: [{ revenue: 42 }], isLoading: false } as DataResponse;
    mockLoadData.mockReturnValue(fakeResponse);

    const result = loadOtherBucketAggregate({
      dataset: makeDataset(),
      dimension: makeDimension(),
      measures: [makeMeasure()],
      active: true,
      headValues: ['A'],
    });

    expect(result).toBe(fakeResponse);
    expect(mockLoadData).toHaveBeenCalledOnce();
  });
});
