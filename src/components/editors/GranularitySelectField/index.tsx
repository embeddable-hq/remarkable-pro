import { useEffect, useMemo } from 'react';
import { useTheme } from '@embeddable.com/react';
import { SelectListOptionProps, SingleSelectField } from '@embeddable.com/remarkable-ui';
import { TimeRange } from '@embeddable.com/core';
import { Theme } from '../../../theme/theme.types';
import { i18nSetup } from '../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../component.utils';
import { EditorCard } from '../shared/EditorCard/EditorCard';

type DateRangePickerPresetsProps = {
  description?: string;
  onChange: (newGranularity: string) => void;
  placeholder?: string;
  primaryTimeRange: TimeRange;
  title?: string;
  granularity?: string;
};

type Granularity = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

const options: SelectListOptionProps[] = [
  { value: 'second', label: 'Second' },
  { value: 'minute', label: 'Minute' },
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
];

/**
 * Ticket defaults: minBuckets=2, maxBuckets=100
 * You can tweak these later if product wants seconds/minutes to appear more often.
 */
const DEFAULT_MIN_BUCKETS = 2;
const DEFAULT_MAX_BUCKETS = 100;

/**
 * Force weeks to start on Monday (1) always.
 */
const WEEK_STARTS_ON = 1;

/**
 * Convert possibly-string timestamps to Date safely.
 */
function toDate(d: unknown): Date | null {
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
  if (typeof d === 'string' || typeof d === 'number') {
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/**
 * Convert inclusive "to" into exclusive end by adding 1ms.
 */
function toExclusiveEnd(inclusiveTo: Date): Date {
  return new Date(inclusiveTo.getTime() + 1);
}

/**
 * --------------------------
 * Bucket-counting (FAST O(1))
 * --------------------------
 * We compute bucket counts using "boundary math" (not loops),
 * which is deterministic and avoids DST accumulation issues.
 */
function bucketCount(start: Date, endExclusive: Date, granularity: Granularity): number {
  if (start >= endExclusive) return 0;

  switch (granularity) {
    case 'second':
      return diffCeil(start, endExclusive, 1000);

    case 'minute':
      return diffCeil(start, endExclusive, 60 * 1000);

    case 'hour':
      return diffCeil(start, endExclusive, 60 * 60 * 1000);

    case 'day':
      return diffInDaysByCalendar(start, endExclusive);

    case 'week':
      return diffInWeeksByCalendarMonday(start, endExclusive);

    case 'month':
      return diffInMonthsByCalendar(start, endExclusive);

    case 'quarter':
      return diffInQuartersByCalendar(start, endExclusive);

    case 'year':
      return diffInYearsByCalendar(start, endExclusive);
  }
}

function diffCeil(start: Date, endExclusive: Date, unitMs: number): number {
  return Math.ceil((endExclusive.getTime() - start.getTime()) / unitMs);
}

function dayIndex(d: Date): number {
  // Local midnight anchor (stable for calendar boundary math)
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(x.getTime() / (24 * 60 * 60 * 1000));
}

function diffInDaysByCalendar(start: Date, endExclusive: Date): number {
  return dayIndex(endExclusive) - dayIndex(start) || 1;
}

/**
 * Week buckets always start Monday.
 */
function startOfWeekMonday(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0=Sun..6=Sat
  const diff = (day - WEEK_STARTS_ON + 7) % 7; // WEEK_STARTS_ON=1 => Monday
  x.setDate(x.getDate() - diff);
  return x;
}

function weekIndexMonday(d: Date): number {
  return dayIndex(startOfWeekMonday(d));
}

function diffInWeeksByCalendarMonday(start: Date, endExclusive: Date): number {
  const startWeek = weekIndexMonday(start);
  const endWeek = weekIndexMonday(endExclusive);
  // Convert day-index difference into week count
  const weeks = Math.ceil((endWeek - startWeek) / 7);
  return weeks > 0 ? weeks : 1;
}

function monthIndex(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth();
}

function diffInMonthsByCalendar(start: Date, endExclusive: Date): number {
  // Distinct months touched
  const months = monthIndex(endExclusive) - monthIndex(start) + 1;
  return months > 0 ? months : 1;
}

function quarterIndex(d: Date): number {
  return d.getFullYear() * 4 + Math.floor(d.getMonth() / 3);
}

function diffInQuartersByCalendar(start: Date, endExclusive: Date): number {
  const quarters = quarterIndex(endExclusive) - quarterIndex(start) + 1;
  return quarters > 0 ? quarters : 1;
}

function diffInYearsByCalendar(start: Date, endExclusive: Date): number {
  const years = endExclusive.getFullYear() - start.getFullYear() + 1;
  return years > 0 ? years : 1;
}

function isGranularityValid(start: Date, endExclusive: Date, granularity: Granularity): boolean {
  const buckets = bucketCount(start, endExclusive, granularity);
  return buckets >= DEFAULT_MIN_BUCKETS && buckets <= DEFAULT_MAX_BUCKETS;
}

function getAvailableGranularityOptionsFromTimeRange(
  timeRange: TimeRange,
  allOptions: SelectListOptionProps[],
): SelectListOptionProps[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const from = toDate((timeRange as any)?.from);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const to = toDate((timeRange as any)?.to);

  // If we can’t parse range, don’t hide anything (fail open)
  if (!from || !to) return allOptions;

  const endExclusive = toExclusiveEnd(to);

  const validSet = new Set<Granularity>();

  for (const opt of allOptions) {
    const g = opt.value as Granularity;
    if (isGranularityValid(from, endExclusive, g)) {
      validSet.add(g);
    }
  }

  // preserve original UI ordering
  return allOptions.filter((opt) => validSet.has(opt.value as Granularity));
}

const DateRangePickerPresets = (props: DateRangePickerPresetsProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const { granularity, onChange } = props;
  const { description, placeholder, title, primaryTimeRange } = resolveI18nProps(props);

  const availableOptions = useMemo(() => {
    return getAvailableGranularityOptionsFromTimeRange(primaryTimeRange, options);
  }, [primaryTimeRange]);

  useEffect(() => {
    if (granularity) {
      // Selected granularity not available - select 2nd or 1st available
      if (!availableOptions.some((opt) => opt.value === granularity)) {
        const newGranularity = (availableOptions[1] ?? availableOptions[0])?.value as string;
        if (newGranularity) {
          onChange(newGranularity);
        }
      }
    }
  }, [availableOptions, granularity, onChange]);

  useEffect(() => {
    if (!primaryTimeRange) {
      onChange('day');
    }
  }, [primaryTimeRange]);

  return (
    <EditorCard title={title} subtitle={description}>
      <SingleSelectField
        clearable
        placeholder={placeholder}
        value={granularity}
        options={availableOptions}
        onChange={onChange}
      />
    </EditorCard>
  );
};

export default DateRangePickerPresets;
