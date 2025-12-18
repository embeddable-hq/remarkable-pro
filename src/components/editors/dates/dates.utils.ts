import { TimeRange } from '@embeddable.com/core';
import { DateRange } from '@embeddable.com/remarkable-ui';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

export const getDateRangeFromTimeRange = (timeRange: TimeRange): DateRange => {
  return {
    from: timeRange?.from ? new Date(timeRange.from) : undefined,
    to: timeRange?.to ? new Date(timeRange.to) : undefined,
  };
};

export const getTimeRangeFromDateRange = (dateRange: DateRange | undefined): TimeRange => {
  if (dateRange === undefined) {
    return dateRange;
  }

  return {
    relativeTimeString: undefined,
    from: dayjs.utc(dateRange.from).toDate(),
    to: dayjs.utc(dateRange.to).toDate(),
  };
};
