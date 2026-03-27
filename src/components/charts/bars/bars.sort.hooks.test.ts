import { renderHook } from '@testing-library/react';
import type { DataResponse, Dimension } from '@embeddable.com/core';
import { useAxisTotals } from './bars.sort.hooks';

vi.mock('../charts.fillGaps.hooks', () => ({
  useFillGaps: (props: { results?: DataResponse }) => props.results,
}));

const makeDimension = (name = 'country'): Dimension =>
  ({ name, title: name, nativeType: 'string', inputs: {} }) as unknown as Dimension;

const makeResponse = (data: Record<string, unknown>[], isLoading = false): DataResponse =>
  ({ data, isLoading }) as DataResponse;

describe('useAxisTotals', () => {
  const axisDimension = makeDimension('country');

  it('returns results from useFillGaps when no totals are provided', () => {
    const results = makeResponse([{ country: 'US', revenue: 100 }]);

    const { result } = renderHook(() => useAxisTotals({ results, axisDimension }));

    expect(result.current.results).toBe(results);
    expect(result.current.axisOrder).toBeUndefined();
  });

  it('returns a loading fallback when results is undefined', () => {
    const { result } = renderHook(() => useAxisTotals({ results: undefined, axisDimension }));

    expect(result.current.results).toEqual({ isLoading: true, data: [] });
  });

  it('calls setAxisTotalValues with extracted axis values when totals resolve', () => {
    const setAxisTotalValues = vi.fn();
    const totals = makeResponse([{ country: 'US' }, { country: 'UK' }]);
    const results = makeResponse([]);

    renderHook(() =>
      useAxisTotals({
        totals,
        totalsKey: 'key-1',
        setAxisTotalValues,
        results,
        axisDimension,
      }),
    );

    expect(setAxisTotalValues).toHaveBeenCalledWith(['US', 'UK'], 'key-1');
  });

  it('does not call setAxisTotalValues when totals is loading', () => {
    const setAxisTotalValues = vi.fn();
    const totals = makeResponse([], true);
    const results = makeResponse([]);

    renderHook(() =>
      useAxisTotals({
        totals,
        totalsKey: 'key-1',
        setAxisTotalValues,
        results,
        axisDimension,
      }),
    );

    expect(setAxisTotalValues).not.toHaveBeenCalled();
  });

  it('does not call setAxisTotalValues when callback is not provided', () => {
    const totals = makeResponse([{ country: 'US' }]);
    const results = makeResponse([]);

    expect(() =>
      renderHook(() => useAxisTotals({ totals, totalsKey: 'key-1', results, axisDimension })),
    ).not.toThrow();
  });

  it('derives axisOrder from totals data', () => {
    const totals = makeResponse([{ country: 'US' }, { country: 'DE' }, { country: 'UK' }]);
    const results = makeResponse([]);

    const { result } = renderHook(() =>
      useAxisTotals({
        totals,
        results,
        axisDimension,
      }),
    );

    expect(result.current.axisOrder).toEqual(['US', 'DE', 'UK']);
  });

  it('re-invokes callback when totalsKey changes', () => {
    const setAxisTotalValues = vi.fn();
    const totals = makeResponse([{ country: 'US' }]);
    const results = makeResponse([]);

    const { rerender } = renderHook(
      (props: { totalsKey: string }) =>
        useAxisTotals({
          totals,
          totalsKey: props.totalsKey,
          setAxisTotalValues,
          results,
          axisDimension,
        }),
      { initialProps: { totalsKey: 'key-1' } },
    );

    expect(setAxisTotalValues).toHaveBeenCalledTimes(1);
    expect(setAxisTotalValues).toHaveBeenCalledWith(['US'], 'key-1');

    rerender({ totalsKey: 'key-2' });

    expect(setAxisTotalValues).toHaveBeenCalledTimes(2);
    expect(setAxisTotalValues).toHaveBeenLastCalledWith(['US'], 'key-2');
  });
});
