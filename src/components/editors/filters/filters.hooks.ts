import { useCallback, useEffect, useRef, useState } from 'react';

export function useFilterBuilderScroll(opts: { itemsSignature: unknown; autoScrollKey: string }) {
  const { itemsSignature, autoScrollKey } = opts;

  const scrollRef = useRef<HTMLDivElement>(null);
  const disableAutoScroll = useRef(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    el.addEventListener('scroll', updateScrollState);
    updateScrollState();
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', updateScrollState);
    };
    // itemsSignature isn't read directly, but overflow (scrollWidth) can change
    // without the container resizing, which ResizeObserver won't catch — re-check
    // scroll state whenever the filter list changes.
  }, [updateScrollState, itemsSignature]);

  // Reset shortly after mount so newly added filters scroll into view, regardless
  // of whether the caller has defaultFilters to seed from.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      disableAutoScroll.current = false;
    }, 100);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (disableAutoScroll.current) return;
    const timer = window.setTimeout(() => {
      scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'smooth' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [autoScrollKey]);

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  const scrollToEnd = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ left: scrollRef.current!.scrollWidth, behavior: 'smooth' });
    }, 0);
  };

  return { scrollRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight, scrollToEnd };
}
