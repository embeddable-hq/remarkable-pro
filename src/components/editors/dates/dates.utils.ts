import { TimeRange } from '@embeddable.com/core';
import { DateRange } from '@embeddable.com/remarkable-ui';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { DateRangeOption } from '../../../theme/defaults/defaults.DateRanges.constants';

dayjs.extend(utc);
dayjs.extend(timezone);

export const getTimeRangeFromPresets = (
  receivedTimeRange: TimeRange,
  options?: DateRangeOption[],
  timezone?: string,
): TimeRange => {
  if (options?.length === 0) {
    return receivedTimeRange;
  }

  if (receivedTimeRange?.relativeTimeString) {
    const selectedOption = options
      ?.find((dateRange) => dateRange.value === receivedTimeRange?.relativeTimeString)
      ?.getRange(timezone);

    const { from, to } = selectedOption || {};

    if (selectedOption) {
      return { from, to, relativeTimeString: receivedTimeRange.relativeTimeString };
    }
  }

  return receivedTimeRange;
};

export const getTimeRangeLabel = (
  range: TimeRange,
  dateFormat: string,
  options?: DateRangeOption[],
  timezone?: string,
): string => {
  const dateRange = getDateRangeFromTimeRange(range, options, timezone);

  if (!dateRange) {
    return '';
  }

  const { from, to } = dateRange;

  const currentUTCYear = new Date().getUTCFullYear();

  const isDifferentYear =
    currentUTCYear !== from?.getUTCFullYear() || currentUTCYear !== to?.getUTCFullYear();

  const format = isDifferentYear ? 'DD MMM YYYY' : dateFormat;

  const labelFrom = dayjs(from).utc().format(format);
  const labelTo = dayjs(to).utc().format(format);

  if (labelFrom === labelTo) {
    return labelFrom;
  }

  return `${labelFrom} - ${labelTo}`;
};

export const getDateRangeFromTimeRange = (
  timeRange: TimeRange,
  options?: DateRangeOption[],
  timezone?: string,
): DateRange | undefined => {
  if (!timeRange) {
    return timeRange;
  }

  let finalTimeRange: TimeRange = timeRange;
  if ((!timeRange?.from || !timeRange?.to) && timeRange?.relativeTimeString && options?.length) {
    const option = options.find((opt) => opt.value === timeRange.relativeTimeString);
    finalTimeRange = option?.getRange(timezone);
  }

  return finalTimeRange;
};

// Resolves the calendar day a Date instant falls on in the given timezone
// (falling back to UTC when no timezone is provided), as a YYYY-MM-DD string.
// Mirrors the convention in defaults.DateRanges.constants.ts so that
// manually-picked ranges line up with the timezone-aware preset ranges.
const getLocalDateString = (date: Date | undefined, tz?: string): string =>
  tz ? dayjs.tz(date, tz).format('YYYY-MM-DD') : dayjs.utc(date).format('YYYY-MM-DD');

export const getTimeRangeFromDateRange = (
  dateRange: DateRange | undefined,
  timezone?: string,
): TimeRange => {
  if (!dateRange) {
    return dateRange;
  }

  // The calendar widget (remarkable-ui's DateRangePicker) already forces `to` to
  // 23:59:59.999 UTC of its own UTC calendar day before we see it. Re-projecting that
  // near-midnight instant straight into `timezone` could tip it into the next day
  // whenever the timezone is ahead of UTC. Normalise it back to that day's UTC
  // start first, so it resolves the same way `from` does.
  const toDayStart = dateRange.to ? dayjs.utc(dateRange.to).startOf('day').toDate() : dateRange.to;

  return {
    relativeTimeString: undefined,
    from: dayjs.utc(getLocalDateString(dateRange.from, timezone)).startOf('day').toDate(),
    to: dayjs.utc(getLocalDateString(toDayStart, timezone)).endOf('day').toDate(),
  };
};
