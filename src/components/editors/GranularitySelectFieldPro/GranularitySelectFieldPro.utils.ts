import { SelectListOptionProps } from '@embeddable.com/remarkable-ui';
import { TimeRange } from '@embeddable.com/core';
import {
  defaultGranularitySelectFieldOptions,
  Granularity,
  TGranularity,
  TGranularityValue,
} from '../../../theme/defaults/defaults.GranularityOptions.constants';
import { resolveI18nString } from '../../component.utils';

const DEFAULT_MIN_BUCKETS = 1;
const DEFAULT_MAX_BUCKETS = 100;

export const getGranularitySelectFieldOptions = () =>
  defaultGranularitySelectFieldOptions.map((opt) => ({
    ...opt,
    label: resolveI18nString(opt.label),
  }));

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
function bucketCount(start: Date, endInclusive: Date, granularity: TGranularity): number {
  if (start > endInclusive) return 0;

  switch (granularity) {
    case Granularity.second:
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 1000);

    case Granularity.minute:
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 60 * 1000);

    case Granularity.hour:
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 60 * 60 * 1000);

    case Granularity.day:
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 24 * 60 * 60 * 1000);

    case Granularity.week:
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 7 * 24 * 60 * 60 * 1000);

    case Granularity.month:
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 28 * 24 * 60 * 60 * 1000); // shortest month

    case Granularity.quarter:
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 90 * 24 * 60 * 60 * 1000); // shortest quarter

    case Granularity.year:
      return bucketCountByUnit(start, toExclusiveEnd(endInclusive), 365 * 24 * 60 * 60 * 1000); // shortest year
  }
}

const isGranularityValid = (
  start: Date,
  endInclusive: Date,
  granularity: TGranularityValue,
): boolean => {
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

  const validSet = new Set<TGranularityValue>();

  for (const opt of allOptions) {
    const g = opt.value as TGranularityValue;
    if (isGranularityValid(from, to, g)) {
      validSet.add(g);
    }
  }

  // preserve original UI ordering
  return allOptions.filter((opt) => validSet.has(opt.value as TGranularityValue));
};
