import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { DimensionOrMeasure } from '@embeddable.com/core';
import { FilterBuilderClause } from './filters.utils';

/** The and/or `{ operator, clauses: [...] }` branch of a FilterBuilderClause —
 * the only shape either builder can seed from. */
export type FilterBuilderClauseGroup = Extract<
  FilterBuilderClause,
  { clauses: FilterBuilderClause[] }
>;

const isClauseGroup = (value: unknown): value is FilterBuilderClauseGroup =>
  !!value &&
  typeof value === 'object' &&
  'clauses' in value &&
  Array.isArray((value as { clauses?: unknown }).clauses);

/**
 * Calls `adopt` when the bound `defaultFilters` becomes a genuinely new value —
 * on mount and whenever the host pushes a change afterwards. `defaultFilters` and
 * the component's `onChange` share the same platform variable, so edits echo back
 * in as a "new" value; we ignore anything matching what we last emitted
 * (`lastEmittedRef`) or last adopted to avoid re-applying our own output.
 *
 * Only a well-formed clause container `{ operator, clauses: [...] }` is treated as
 * a signal; `null` / `undefined` / `{}` / sentinels (e.g. `Value.noFilter()`) are
 * ignored so a missing binding never wipes state. The caller's `adopt` decides
 * what to do with it — including whether to honour post-mount changes (see
 * `syncDefaultFilters` in the builders) and what an empty `{ clauses: [] }` means.
 */
export function useAdoptDefaultFilters(opts: {
  defaultFilters: FilterBuilderClause | undefined;
  dimensionsAndMeasures: DimensionOrMeasure[];
  lastEmittedRef: MutableRefObject<unknown>;
  adopt: (clause: FilterBuilderClauseGroup) => void;
}): void {
  const { defaultFilters, dimensionsAndMeasures, lastEmittedRef, adopt } = opts;
  const lastAdoptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!dimensionsAndMeasures?.length) return;
    if (!isClauseGroup(defaultFilters)) return;

    const serialized = JSON.stringify(defaultFilters);

    // Our own onChange echo coming back through the shared variable — record it
    // so a later genuine change is still detected, but don't re-apply it.
    if (serialized === JSON.stringify(lastEmittedRef.current ?? null)) {
      lastAdoptedRef.current = serialized;
      return;
    }

    // Already applied this exact value.
    if (serialized === lastAdoptedRef.current) return;

    lastAdoptedRef.current = serialized;
    adopt(defaultFilters);
  }, [defaultFilters, dimensionsAndMeasures, adopt, lastEmittedRef]);
}

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
