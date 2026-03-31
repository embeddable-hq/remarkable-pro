import { renderHook } from '@testing-library/react';
import type { DataResponse, Dimension } from '@embeddable.com/core';
import { useSyncAxisItems } from './bars.hooks';

const makeDimension = (name = 'country'): Dimension =>
  ({ name, title: 'Country', nativeType: 'string', inputs: {} }) as unknown as Dimension;

const makeDataResponse = (
  data: Record<string, unknown>[] | undefined,
  isLoading: boolean,
): DataResponse => ({ data, isLoading, error: undefined }) as unknown as DataResponse;

describe('useSyncAxisItems', () => {
  it('calls setAxisItems with values and key when totals data arrives', () => {
    const setAxisItems = vi.fn();
    const totals = makeDataResponse(
      [{ country: 'FR' }, { country: 'DE' }, { country: 'PL' }],
      false,
    );

    renderHook(() => useSyncAxisItems(totals, makeDimension(), setAxisItems, 'key-1'));

    expect(setAxisItems).toHaveBeenCalledWith(['FR', 'DE', 'PL'], 'key-1');
  });

  it('does not call setAxisItems while still loading', () => {
    const setAxisItems = vi.fn();
    const totals = makeDataResponse(undefined, true);

    renderHook(() => useSyncAxisItems(totals, makeDimension(), setAxisItems, 'key-1'));

    expect(setAxisItems).not.toHaveBeenCalled();
  });

  it('does not call setAxisItems when resultsTotals is undefined', () => {
    const setAxisItems = vi.fn();

    renderHook(() => useSyncAxisItems(undefined, makeDimension(), setAxisItems, undefined));

    expect(setAxisItems).not.toHaveBeenCalled();
  });

  it('does not call setAxisItems when currentTotalsKey is undefined', () => {
    const setAxisItems = vi.fn();
    const totals = makeDataResponse([{ country: 'FR' }], false);

    renderHook(() => useSyncAxisItems(totals, makeDimension(), setAxisItems, undefined));

    expect(setAxisItems).not.toHaveBeenCalled();
  });

  it('filters out null values from axis data', () => {
    const setAxisItems = vi.fn();
    const totals = makeDataResponse(
      [{ country: 'FR' }, { country: null }, { country: 'DE' }],
      false,
    );

    renderHook(() => useSyncAxisItems(totals, makeDimension(), setAxisItems, 'key-1'));

    expect(setAxisItems).toHaveBeenCalledWith(['FR', 'DE'], 'key-1');
  });

  it('handles empty data array', () => {
    const setAxisItems = vi.fn();
    const totals = makeDataResponse([], false);

    renderHook(() => useSyncAxisItems(totals, makeDimension(), setAxisItems, 'key-1'));

    expect(setAxisItems).toHaveBeenCalledWith([], 'key-1');
  });

  it('updates when totals data changes between renders', () => {
    const setAxisItems = vi.fn();
    const dim = makeDimension();

    const { rerender } = renderHook(
      ({ totals, key }) => useSyncAxisItems(totals, dim, setAxisItems, key),
      {
        initialProps: {
          totals: makeDataResponse([{ country: 'FR' }], false),
          key: 'key-1',
        },
      },
    );

    expect(setAxisItems).toHaveBeenCalledWith(['FR'], 'key-1');
    setAxisItems.mockClear();

    rerender({
      totals: makeDataResponse([{ country: 'DE' }, { country: 'PL' }], false),
      key: 'key-2',
    });

    expect(setAxisItems).toHaveBeenCalledWith(['DE', 'PL'], 'key-2');
  });

  it('does not call setAxisItems when data is undefined but not loading', () => {
    const setAxisItems = vi.fn();
    const totals = makeDataResponse(undefined, false);

    renderHook(() => useSyncAxisItems(totals, makeDimension(), setAxisItems, 'key-1'));

    expect(setAxisItems).not.toHaveBeenCalled();
  });
});
