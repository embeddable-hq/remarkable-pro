import { renderHook } from '@testing-library/react';
import type { DataResponse, Dimension } from '@embeddable.com/core';
import { useUpdateOtherBucketState } from './charts.otherBucket.hooks';

const makeDimension = (name = 'category'): Dimension =>
  ({ name, title: 'Category', nativeType: 'string', inputs: {} }) as unknown as Dimension;

const makeDataResponse = (
  data: Record<string, unknown>[] | undefined,
  isLoading: boolean,
): DataResponse => ({ data, isLoading, error: undefined }) as unknown as DataResponse;

describe('useUpdateOtherBucketState', () => {
  it('calls setOtherBucketState with head info and cache key when results resolve and bucketing is truncated', () => {
    const setOtherBucketState = vi.fn();
    const results = makeDataResponse(
      [{ category: 'A' }, { category: 'B' }, { category: 'C' }],
      false,
    );

    renderHook(() =>
      useUpdateOtherBucketState({
        results,
        dimension: makeDimension(),
        maxItems: 2,
        maxResults: 3,
        cacheKey: 'key-1',
        setOtherBucketState,
      }),
    );

    expect(setOtherBucketState).toHaveBeenCalledWith({ active: true, headValues: ['A'] }, 'key-1');
  });

  it('calls setOtherBucketState with inactive info when not truncated', () => {
    const setOtherBucketState = vi.fn();
    const results = makeDataResponse([{ category: 'A' }, { category: 'B' }], false);

    renderHook(() =>
      useUpdateOtherBucketState({
        results,
        dimension: makeDimension(),
        maxItems: 2,
        maxResults: 1000,
        cacheKey: 'key-1',
        setOtherBucketState,
      }),
    );

    expect(setOtherBucketState).toHaveBeenCalledWith({ active: false, headValues: [] }, 'key-1');
  });

  it('does not call setOtherBucketState while still loading', () => {
    const setOtherBucketState = vi.fn();
    const results = makeDataResponse(undefined, true);

    renderHook(() =>
      useUpdateOtherBucketState({
        results,
        dimension: makeDimension(),
        maxItems: 2,
        maxResults: 3,
        cacheKey: 'key-1',
        setOtherBucketState,
      }),
    );

    expect(setOtherBucketState).not.toHaveBeenCalled();
  });

  it('does not call setOtherBucketState when results is undefined', () => {
    const setOtherBucketState = vi.fn();

    renderHook(() =>
      useUpdateOtherBucketState({
        results: undefined,
        dimension: makeDimension(),
        maxItems: 2,
        maxResults: 3,
        cacheKey: 'key-1',
        setOtherBucketState,
      }),
    );

    expect(setOtherBucketState).not.toHaveBeenCalled();
  });

  it('does not call setOtherBucketState when cacheKey is undefined', () => {
    const setOtherBucketState = vi.fn();
    const results = makeDataResponse([{ category: 'A' }], false);

    renderHook(() =>
      useUpdateOtherBucketState({
        results,
        dimension: makeDimension(),
        maxItems: 2,
        maxResults: 3,
        cacheKey: undefined,
        setOtherBucketState,
      }),
    );

    expect(setOtherBucketState).not.toHaveBeenCalled();
  });

  it('does not throw when setOtherBucketState is undefined', () => {
    const results = makeDataResponse([{ category: 'A' }], false);

    expect(() =>
      renderHook(() =>
        useUpdateOtherBucketState({
          results,
          dimension: makeDimension(),
          maxItems: 2,
          maxResults: 3,
          cacheKey: 'key-1',
          setOtherBucketState: undefined,
        }),
      ),
    ).not.toThrow();
  });

  it('recomputes when results changes between renders', () => {
    const setOtherBucketState = vi.fn();
    const dim = makeDimension();

    const { rerender } = renderHook(
      ({ results, cacheKey }) =>
        useUpdateOtherBucketState({
          results,
          dimension: dim,
          maxItems: 2,
          maxResults: 3,
          cacheKey,
          setOtherBucketState,
        }),
      {
        initialProps: {
          results: makeDataResponse([{ category: 'A' }, { category: 'B' }], false),
          cacheKey: 'key-1',
        },
      },
    );

    expect(setOtherBucketState).toHaveBeenCalledWith({ active: false, headValues: [] }, 'key-1');
    setOtherBucketState.mockClear();

    rerender({
      results: makeDataResponse([{ category: 'A' }, { category: 'B' }, { category: 'C' }], false),
      cacheKey: 'key-2',
    });

    expect(setOtherBucketState).toHaveBeenCalledWith({ active: true, headValues: ['A'] }, 'key-2');
  });
});
