import { renderHook, act } from '@testing-library/react';
import { useFilterBuilderScroll } from './filters.hooks';

const simulateScrollState = (
  el: HTMLDivElement,
  scrollLeft: number,
  clientWidth: number,
  scrollWidth: number,
) => {
  Object.defineProperty(el, 'scrollLeft', { value: scrollLeft, configurable: true });
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true });
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true });
};

beforeEach(() => {
  vi.useFakeTimers();
  globalThis.ResizeObserver = vi.fn().mockImplementation(function () {
    return { observe: vi.fn(), disconnect: vi.fn() };
  }) as unknown as typeof ResizeObserver;
  HTMLElement.prototype.scrollBy = vi.fn();
  HTMLElement.prototype.scrollTo = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const attachScrollRef = (result: {
  current: { scrollRef: { current: HTMLDivElement | null } };
}) => {
  const el = document.createElement('div');
  result.current.scrollRef.current = el;
  return el;
};

describe('useFilterBuilderScroll', () => {
  it('starts with scroll buttons hidden', () => {
    const { result } = renderHook(() =>
      useFilterBuilderScroll({ itemsSignature: 'a', autoScrollKey: 'k1' }),
    );
    expect(result.current.canScrollLeft).toBe(false);
    expect(result.current.canScrollRight).toBe(false);
  });

  it('calls scrollBy(-200) on scrollLeft()', () => {
    const { result } = renderHook(() =>
      useFilterBuilderScroll({ itemsSignature: 'a', autoScrollKey: 'k1' }),
    );
    attachScrollRef(result);
    result.current.scrollLeft();
    expect(HTMLElement.prototype.scrollBy).toHaveBeenCalledWith({
      left: -200,
      behavior: 'smooth',
    });
  });

  it('calls scrollBy(200) on scrollRight()', () => {
    const { result } = renderHook(() =>
      useFilterBuilderScroll({ itemsSignature: 'a', autoScrollKey: 'k1' }),
    );
    attachScrollRef(result);
    result.current.scrollRight();
    expect(HTMLElement.prototype.scrollBy).toHaveBeenCalledWith({ left: 200, behavior: 'smooth' });
  });

  it('scrollToEnd scrolls to scrollWidth after a tick', () => {
    const { result } = renderHook(() =>
      useFilterBuilderScroll({ itemsSignature: 'a', autoScrollKey: 'k1' }),
    );
    const el = attachScrollRef(result);
    simulateScrollState(el, 0, 100, 500);

    result.current.scrollToEnd();
    act(() => vi.advanceTimersByTime(0));

    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledWith({
      left: 500,
      behavior: 'smooth',
    });
  });

  it('auto-scrolls to the end when autoScrollKey changes after the initial guard clears', () => {
    const { result, rerender } = renderHook(
      ({ autoScrollKey }) => useFilterBuilderScroll({ itemsSignature: 'a', autoScrollKey }),
      { initialProps: { autoScrollKey: 'k1' } },
    );
    const el = attachScrollRef(result);
    simulateScrollState(el, 0, 100, 400);

    // Clear the mount guard (fixes the bug where auto-scroll never re-enabled
    // without a defaultFilters-style seed effect).
    act(() => vi.advanceTimersByTime(100));

    rerender({ autoScrollKey: 'k2' });
    act(() => vi.advanceTimersByTime(100));

    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledWith({
      left: 400,
      behavior: 'smooth',
    });
  });

  it('does not auto-scroll before the mount guard clears', () => {
    const { result, rerender } = renderHook(
      ({ autoScrollKey }) => useFilterBuilderScroll({ itemsSignature: 'a', autoScrollKey }),
      { initialProps: { autoScrollKey: 'k1' } },
    );
    attachScrollRef(result);

    rerender({ autoScrollKey: 'k2' });
    act(() => vi.advanceTimersByTime(50));

    expect(HTMLElement.prototype.scrollTo).not.toHaveBeenCalled();
  });
});
