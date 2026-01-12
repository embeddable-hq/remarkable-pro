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

const DEFAULT_MIN_BUCKETS = 2;
const DEFAULT_MAX_BUCKETS = 100;

// Force weeks to start on Monday (1) always.
const WEEK_STARTS_ON = 1 as const;

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

// Bucket counting (treat end as INCLUSIVE)
function bucketCount(start: Date, endInclusive: Date, granularity: Granularity): number {
  if (start > endInclusive) return 0;

  switch (granularity) {
    case 'second':
      return diffCeil(start, toExclusiveEnd(endInclusive), 1000);

    case 'minute':
      return diffCeil(start, toExclusiveEnd(endInclusive), 60 * 1000);

    case 'hour':
      return diffCeil(start, toExclusiveEnd(endInclusive), 60 * 60 * 1000);

    case 'day':
      return diffInDaysByCalendar(start, endInclusive);

    case 'week':
      return diffInWeeksByCalendarMonday(start, endInclusive);

    case 'month':
      return diffInMonthsByCalendar(start, endInclusive);

    case 'quarter':
      return diffInQuartersByCalendar(start, endInclusive);

    case 'year':
      return diffInYearsByCalendar(start, endInclusive);
  }
}

const diffCeil = (start: Date, endExclusive: Date, unitMs: number): number => {
  return Math.ceil((endExclusive.getTime() - start.getTime()) / unitMs);
};

const dayIndex = (d: Date): number => {
  // Local midnight anchor (stable for calendar boundary math)
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(x.getTime() / (24 * 60 * 60 * 1000));
};

// Distinct calendar days touched (inclusive)
const diffInDaysByCalendar = (start: Date, endInclusive: Date): number => {
  return dayIndex(endInclusive) - dayIndex(start) + 1;
};

// Week buckets always start Monday.
const startOfWeekMonday = (d: Date): Date => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0=Sun..6=Sat
  const diff = (day - WEEK_STARTS_ON + 7) % 7; // WEEK_STARTS_ON=1 => Monday
  x.setDate(x.getDate() - diff);
  return x;
};

const weekIndexMonday = (d: Date): number => {
  return dayIndex(startOfWeekMonday(d));
};

// Distinct Monday-start weeks touched (inclusive)
const diffInWeeksByCalendarMonday = (start: Date, endInclusive: Date): number => {
  const startWeek = weekIndexMonday(start);
  const endWeek = weekIndexMonday(endInclusive);
  return Math.floor((endWeek - startWeek) / 7) + 1;
};

const monthIndex = (d: Date): number => {
  return d.getFullYear() * 12 + d.getMonth();
};

// Distinct months touched (inclusive)
const diffInMonthsByCalendar = (start: Date, endInclusive: Date): number => {
  return monthIndex(endInclusive) - monthIndex(start) + 1;
};

const quarterIndex = (d: Date): number => {
  return d.getFullYear() * 4 + Math.floor(d.getMonth() / 3);
};

// Distinct quarters touched (inclusive)
const diffInQuartersByCalendar = (start: Date, endInclusive: Date): number => {
  return quarterIndex(endInclusive) - quarterIndex(start) + 1;
};

// Distinct years touched (inclusive)
const diffInYearsByCalendar = (start: Date, endInclusive: Date): number => {
  return endInclusive.getFullYear() - start.getFullYear() + 1;
};

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
