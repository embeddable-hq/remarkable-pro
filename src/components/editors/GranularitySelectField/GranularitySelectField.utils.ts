import { SelectListOptionProps } from '@embeddable.com/remarkable-ui';
import { TimeRange } from '@embeddable.com/core';

type Granularity = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export const granularitySelectFieldOptions: SelectListOptionProps[] = [
  { value: 'second', label: 'Second' },
  { value: 'minute', label: 'Minute' },
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
];

const DEFAULT_MIN_BUCKETS = 1;
const DEFAULT_MAX_BUCKETS = 100;

// Convert possibly-string timestamps to Date safely.
const toDate = (d: unknown): Date | null => {
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
  if (typeof d === 'string' || typeof d === 'number') {
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

// Inclusive end -> Exclusive end helper (only used for sub-day diffs)
const toExclusiveEnd = (endInclusive: Date): Date => new Date(endInclusive.getTime() + 1);

const bucketCountByUnit = (start: Date, endExclusive: Date, unitMs: number): number => {
  return (endExclusive.getTime() - start.getTime()) / unitMs;
};

// Bucket counting (treat end as INCLUSIVE)
function bucketCount(start: Date, endInclusive: Date, granularity: Granularity): number {
  if (start > endInclusive) return 0;

  switch (granularity) {
    case 'second':
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 1000);

    case 'minute':
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 60 * 1000);

    case 'hour':
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 60 * 60 * 1000);

    case 'day':
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 24 * 60 * 60 * 1000);

    case 'week':
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 7 * 24 * 60 * 60 * 1000);

    case 'month':
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 28 * 24 * 60 * 60 * 1000); // shortest month

    case 'quarter':
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 90 * 24 * 60 * 60 * 1000); // shortest quarter

    case 'year':
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 365 * 24 * 60 * 60 * 1000); // shortest year
  }
}

const isGranularityValid = (start: Date, endInclusive: Date, granularity: Granularity): boolean => {
  const buckets = bucketCount(start, endInclusive, granularity);
  return buckets >= DEFAULT_MIN_BUCKETS && buckets <= DEFAULT_MAX_BUCKETS;
};

export const getAvailableGranularityOptionsFromTimeRange = (
  timeRange: TimeRange,
  allOptions: SelectListOptionProps[],
): SelectListOptionProps[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const from = toDate((timeRange as any)?.from);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const to = toDate((timeRange as any)?.to);

  // If we can’t parse range, don’t hide anything (fail open)
  if (!from || !to) return allOptions;

  const validSet = new Set<Granularity>();

  for (const opt of allOptions) {
    const g = opt.value as Granularity;
    if (isGranularityValid(from, to, g)) {
      validSet.add(g);
    }
  }

  // preserve original UI ordering
  return allOptions.filter((opt) => validSet.has(opt.value as Granularity));
};
