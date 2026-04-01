import { renderHook } from '@testing-library/react';
import type { DataResponse, Dimension } from '@embeddable.com/core';
import { useUpdateAxisOrder } from './bars.hooks';

const makeDimension = (name = 'country'): Dimension =>
  ({ name, title: 'Country', nativeType: 'string', inputs: {} }) as unknown as Dimension;

const makeDataResponse = (
  data: Record<string, unknown>[] | undefined,
  isLoading: boolean,
): DataResponse => ({ data, isLoading, error: undefined }) as unknown as DataResponse;

describe('useUpdateAxisOrder', () => {
  it('calls setAxisOrder with values and key when axis order data arrives', () => {
    const setAxisOrder = vi.fn();
    const resultsAxisOrder = makeDataResponse(
      [{ country: 'FR' }, { country: 'DE' }, { country: 'PL' }],
      false,
    );

    renderHook(() =>
      useUpdateAxisOrder({
        resultsAxisOrder,
        axisDimension: makeDimension(),
        setAxisOrder,
        currentAxisOrderKey: 'key-1',
      }),
    );

    expect(setAxisOrder).toHaveBeenCalledWith(['FR', 'DE', 'PL'], 'key-1');
  });

  it('does not call setAxisOrder while still loading', () => {
    const setAxisOrder = vi.fn();
    const resultsAxisOrder = makeDataResponse(undefined, true);

    renderHook(() =>
      useUpdateAxisOrder({
        resultsAxisOrder,
        axisDimension: makeDimension(),
        setAxisOrder,
        currentAxisOrderKey: 'key-1',
      }),
    );

    expect(setAxisOrder).not.toHaveBeenCalled();
  });

  it('does not call setAxisOrder when resultsAxisOrder is undefined', () => {
    const setAxisOrder = vi.fn();

    renderHook(() =>
      useUpdateAxisOrder({
        resultsAxisOrder: undefined,
        axisDimension: makeDimension(),
        setAxisOrder,
        currentAxisOrderKey: undefined,
      }),
    );

    expect(setAxisOrder).not.toHaveBeenCalled();
  });

  it('does not call setAxisOrder when currentAxisOrderKey is undefined', () => {
    const setAxisOrder = vi.fn();
    const resultsAxisOrder = makeDataResponse([{ country: 'FR' }], false);

    renderHook(() =>
      useUpdateAxisOrder({
        resultsAxisOrder,
        axisDimension: makeDimension(),
        setAxisOrder,
        currentAxisOrderKey: undefined,
      }),
    );

    expect(setAxisOrder).not.toHaveBeenCalled();
  });

  it('does not call when setAxisOrder is undefined (nullable)', () => {
    const resultsAxisOrder = makeDataResponse([{ country: 'FR' }], false);

    renderHook(() =>
      useUpdateAxisOrder({
        resultsAxisOrder,
        axisDimension: makeDimension(),
        setAxisOrder: undefined,
        currentAxisOrderKey: 'key-1',
      }),
    );
  });

  it('filters out null values from axis data', () => {
    const setAxisOrder = vi.fn();
    const resultsAxisOrder = makeDataResponse(
      [{ country: 'FR' }, { country: null }, { country: 'DE' }],
      false,
    );

    renderHook(() =>
      useUpdateAxisOrder({
        resultsAxisOrder,
        axisDimension: makeDimension(),
        setAxisOrder,
        currentAxisOrderKey: 'key-1',
      }),
    );

    expect(setAxisOrder).toHaveBeenCalledWith(['FR', 'DE'], 'key-1');
  });

  it('handles empty data array', () => {
    const setAxisOrder = vi.fn();
    const resultsAxisOrder = makeDataResponse([], false);

    renderHook(() =>
      useUpdateAxisOrder({
        resultsAxisOrder,
        axisDimension: makeDimension(),
        setAxisOrder,
        currentAxisOrderKey: 'key-1',
      }),
    );

    expect(setAxisOrder).toHaveBeenCalledWith([], 'key-1');
  });

  it('updates when axis order data changes between renders', () => {
    const setAxisOrder = vi.fn();
    const dim = makeDimension();

    const { rerender } = renderHook(
      ({ resultsAxisOrder, key }) =>
        useUpdateAxisOrder({
          resultsAxisOrder,
          axisDimension: dim,
          setAxisOrder,
          currentAxisOrderKey: key,
        }),
      {
        initialProps: {
          resultsAxisOrder: makeDataResponse([{ country: 'FR' }], false),
          key: 'key-1',
        },
      },
    );

    expect(setAxisOrder).toHaveBeenCalledWith(['FR'], 'key-1');
    setAxisOrder.mockClear();

    rerender({
      resultsAxisOrder: makeDataResponse([{ country: 'DE' }, { country: 'PL' }], false),
      key: 'key-2',
    });

    expect(setAxisOrder).toHaveBeenCalledWith(['DE', 'PL'], 'key-2');
  });

  it('does not call setAxisOrder when data is undefined but not loading', () => {
    const setAxisOrder = vi.fn();
    const resultsAxisOrder = makeDataResponse(undefined, false);

    renderHook(() =>
      useUpdateAxisOrder({
        resultsAxisOrder,
        axisDimension: makeDimension(),
        setAxisOrder,
        currentAxisOrderKey: 'key-1',
      }),
    );

    expect(setAxisOrder).not.toHaveBeenCalled();
  });
});
