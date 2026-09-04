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

// Anchors `date` to the start of its calendar day in `tz` (or in UTC when no
// timezone is given). Matches defaults.DateRanges.constants.ts so manual
// picks line up with preset ranges.
const startOfDayIn = (date: Date | undefined, tz?: string) =>
  tz ? dayjs(date).tz(tz).startOf('day') : dayjs.utc(date).startOf('day');

export const getTimeRangeFromDateRange = (
  dateRange: DateRange | undefined,
  timezone?: string,
): TimeRange => {
  if (!dateRange) {
    return dateRange;
  }

  // Single click leaves `to` undefined; treat it as a single-day pick instead of "now".
  const to = dateRange.to ?? dateRange.from;

  // `to` arrives pre-forced to 23:59:59.999 UTC; re-derive its day start so it
  // resolves through `timezone` the same way `from` does, instead of tipping over.
  const toDayStart = dayjs.utc(to).startOf('day').toDate();

  return {
    relativeTimeString: undefined,
    from: startOfDayIn(dateRange.from, timezone).toDate(),
    to: startOfDayIn(toDayStart, timezone).endOf('day').toDate(),
  };
};
