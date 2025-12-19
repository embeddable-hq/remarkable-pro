import { TimeRange } from '@embeddable.com/core';
import { DateRange } from '@embeddable.com/remarkable-ui';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { DateRangeOption } from '../../../theme/defaults/defaults.DateRanges.constants';

dayjs.extend(utc);

export const getTimeRangeFromPresets = (
  receivedTimeRange: TimeRange,
  options?: DateRangeOption[],
): TimeRange => {
  if (options?.length === 0) {
    return receivedTimeRange;
  }

  if (receivedTimeRange?.relativeTimeString) {
    const selectedOption = options
      ?.find((dateRange) => dateRange.value === receivedTimeRange?.relativeTimeString)
      ?.getRange();

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
): string => {
  const dateRange = getDateRangeFromTimeRange(range, options);

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
): DateRange | undefined => {
  if (!timeRange) {
    return timeRange;
  }

  let finalTimeRange: TimeRange = timeRange;
  if ((!timeRange?.from || !timeRange?.to) && timeRange?.relativeTimeString && options?.length) {
    const option = options.find((opt) => opt.value === timeRange!.relativeTimeString);
    finalTimeRange = option?.getRange() as TimeRange;
  }

  return finalTimeRange;
};

export const getTimeRangeFromDateRange = (dateRange: DateRange | undefined): TimeRange => {
  if (!dateRange) {
    return dateRange;
  }

  return {
    relativeTimeString: undefined,
    from: dayjs.utc(dateRange.from).toDate(),
    to: dayjs.utc(dateRange.to).toDate(),
  };
};
