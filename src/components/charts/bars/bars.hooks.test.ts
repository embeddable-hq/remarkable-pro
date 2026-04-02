import { renderHook } from '@testing-library/react';
import type { DataResponse, Dimension } from '@embeddable.com/core';
import { useUpdateAxisOrderAndCacheKey } from './bars.hooks';

const makeDimension = (name = 'country'): Dimension =>
  ({ name, title: 'Country', nativeType: 'string', inputs: {} }) as unknown as Dimension;

const makeDataResponse = (
  data: Record<string, unknown>[] | undefined,
  isLoading: boolean,
): DataResponse => ({ data, isLoading, error: undefined }) as unknown as DataResponse;

describe('useUpdateAxisOrderAndCacheKey', () => {
  it('calls setAxisOrderAndCacheKey with values and key when axis order data arrives', () => {
    const setAxisOrderAndCacheKey = vi.fn();
    const resultsAxisOrder = makeDataResponse(
      [{ country: 'FR' }, { country: 'DE' }, { country: 'PL' }],
      false,
    );

    renderHook(() =>
      useUpdateAxisOrderAndCacheKey({
        resultsAxisOrder,
        axisDimension: makeDimension(),
        setAxisOrderAndCacheKey,
        axisOrderCacheKey: 'key-1',
      }),
    );

    expect(setAxisOrderAndCacheKey).toHaveBeenCalledWith(['FR', 'DE', 'PL'], 'key-1');
  });

  it('does not call setAxisOrderAndCacheKey while still loading', () => {
    const setAxisOrderAndCacheKey = vi.fn();
    const resultsAxisOrder = makeDataResponse(undefined, true);

    renderHook(() =>
      useUpdateAxisOrderAndCacheKey({
        resultsAxisOrder,
        axisDimension: makeDimension(),
        setAxisOrderAndCacheKey,
        axisOrderCacheKey: 'key-1',
      }),
    );

    expect(setAxisOrderAndCacheKey).not.toHaveBeenCalled();
  });

  it('does not call setAxisOrderAndCacheKey when resultsAxisOrder is undefined', () => {
    const setAxisOrderAndCacheKey = vi.fn();

    renderHook(() =>
      useUpdateAxisOrderAndCacheKey({
        resultsAxisOrder: undefined,
        axisDimension: makeDimension(),
        setAxisOrderAndCacheKey,
        axisOrderCacheKey: undefined,
      }),
    );

    expect(setAxisOrderAndCacheKey).not.toHaveBeenCalled();
  });

  it('does not call setAxisOrderAndCacheKey when axisOrderCacheKey is undefined', () => {
    const setAxisOrderAndCacheKey = vi.fn();
    const resultsAxisOrder = makeDataResponse([{ country: 'FR' }], false);

    renderHook(() =>
      useUpdateAxisOrderAndCacheKey({
        resultsAxisOrder,
        axisDimension: makeDimension(),
        setAxisOrderAndCacheKey,
        axisOrderCacheKey: undefined,
      }),
    );

    expect(setAxisOrderAndCacheKey).not.toHaveBeenCalled();
  });

  it('does not call when setAxisOrderAndCacheKey is undefined (nullable)', () => {
    const resultsAxisOrder = makeDataResponse([{ country: 'FR' }], false);

    renderHook(() =>
      useUpdateAxisOrderAndCacheKey({
        resultsAxisOrder,
        axisDimension: makeDimension(),
        setAxisOrderAndCacheKey: undefined,
        axisOrderCacheKey: 'key-1',
      }),
    );
  });

  it('filters out null values from axis data', () => {
    const setAxisOrderAndCacheKey = vi.fn();
    const resultsAxisOrder = makeDataResponse(
      [{ country: 'FR' }, { country: null }, { country: 'DE' }],
      false,
    );

    renderHook(() =>
      useUpdateAxisOrderAndCacheKey({
        resultsAxisOrder,
        axisDimension: makeDimension(),
        setAxisOrderAndCacheKey,
        axisOrderCacheKey: 'key-1',
      }),
    );

    expect(setAxisOrderAndCacheKey).toHaveBeenCalledWith(['FR', 'DE'], 'key-1');
  });

  it('handles empty data array', () => {
    const setAxisOrderAndCacheKey = vi.fn();
    const resultsAxisOrder = makeDataResponse([], false);

    renderHook(() =>
      useUpdateAxisOrderAndCacheKey({
        resultsAxisOrder,
        axisDimension: makeDimension(),
        setAxisOrderAndCacheKey,
        axisOrderCacheKey: 'key-1',
      }),
    );

    expect(setAxisOrderAndCacheKey).toHaveBeenCalledWith([], 'key-1');
  });

  it('updates when axis order data changes between renders', () => {
    const setAxisOrderAndCacheKey = vi.fn();
    const dim = makeDimension();

    const { rerender } = renderHook(
      ({ resultsAxisOrder, key }) =>
        useUpdateAxisOrderAndCacheKey({
          resultsAxisOrder,
          axisDimension: dim,
          setAxisOrderAndCacheKey,
          axisOrderCacheKey: key,
        }),
      {
        initialProps: {
          resultsAxisOrder: makeDataResponse([{ country: 'FR' }], false),
          key: 'key-1',
        },
      },
    );

    expect(setAxisOrderAndCacheKey).toHaveBeenCalledWith(['FR'], 'key-1');
    setAxisOrderAndCacheKey.mockClear();

    rerender({
      resultsAxisOrder: makeDataResponse([{ country: 'DE' }, { country: 'PL' }], false),
      key: 'key-2',
    });

    expect(setAxisOrderAndCacheKey).toHaveBeenCalledWith(['DE', 'PL'], 'key-2');
  });

  it('does not call setAxisOrderAndCacheKey when data is undefined but not loading', () => {
    const setAxisOrderAndCacheKey = vi.fn();
    const resultsAxisOrder = makeDataResponse(undefined, false);

    renderHook(() =>
      useUpdateAxisOrderAndCacheKey({
        resultsAxisOrder,
        axisDimension: makeDimension(),
        setAxisOrderAndCacheKey,
        axisOrderCacheKey: 'key-1',
      }),
    );

    expect(setAxisOrderAndCacheKey).not.toHaveBeenCalled();
  });
});
