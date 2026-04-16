import { TimeRange } from '@embeddable.com/core';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import quarterOfYear from 'dayjs/plugin/quarterOfYear.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

const makeTimeRange = (from: Date, to: Date): TimeRange => ({ from, to, relativeTimeString: '' });

const getLocalDateString = (date: Date, tz?: string): string =>
  tz ? dayjs.tz(date, tz).format('YYYY-MM-DD') : dayjs.utc(date).format('YYYY-MM-DD');

const getNow = (tz?: string) => dayjs.utc(getLocalDateString(new Date(), tz));

const getDayBounds = (offset = 0, tz?: string): TimeRange => {
  const d = getNow(tz).add(offset, 'day');
  return makeTimeRange(d.startOf('day').toDate(), d.endOf('day').toDate());
};

const getWeekBounds = (offset = 0, tz?: string): TimeRange => {
  const d = getNow(tz).add(offset, 'week');
  return makeTimeRange(d.startOf('isoWeek').toDate(), d.endOf('isoWeek').toDate());
};

const getMonthBounds = (offset = 0, tz?: string): TimeRange => {
  const d = getNow(tz).add(offset, 'month');
  return makeTimeRange(d.startOf('month').toDate(), d.endOf('month').toDate());
};

const getQuarterBounds = (offset = 0, tz?: string): TimeRange => {
  const d = getNow(tz).add(offset, 'quarter');
  return makeTimeRange(d.startOf('quarter').toDate(), d.endOf('quarter').toDate());
};

const getYearBounds = (offset = 0, tz?: string): TimeRange => {
  const d = getNow(tz).add(offset, 'year');
  return makeTimeRange(d.startOf('year').toDate(), d.endOf('year').toDate());
};

const getLastNDays = (n: number, tz?: string): TimeRange => {
  const now = getNow(tz);
  return makeTimeRange(
    now
      .subtract(n - 1, 'day')
      .startOf('day')
      .toDate(),
    now.endOf('day').toDate(),
  );
};

const getNextNDays = (n: number, tz?: string): TimeRange => {
  const now = getNow(tz);
  return makeTimeRange(
    now.startOf('day').toDate(),
    now
      .add(n - 1, 'day')
      .endOf('day')
      .toDate(),
  );
};

const getLastNMonths = (n: number, tz?: string): TimeRange => {
  const now = getNow(tz);
  return makeTimeRange(now.subtract(n, 'month').startOf('day').toDate(), now.endOf('day').toDate());
};

const getUnitToDate = (unit: 'isoWeek' | 'quarter' | 'year', tz?: string): TimeRange => {
  const now = getNow(tz);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return makeTimeRange(now.startOf(unit as any).toDate(), now.endOf('day').toDate());
};

export type DateRangeOption = {
  value: string;
  label: string;
  dateFormat: string;
  getRange: (timezone?: string) => TimeRange;
};

export const defaultDateRangeOptions: DateRangeOption[] = [
  {
    value: 'Today',
    label: 'defaults.dateRangeOptions.today|Today',
    dateFormat: 'MMM DD',
    getRange: (tz?: string) => getDayBounds(0, tz),
  },
  {
    value: 'Yesterday',
    label: 'defaults.dateRangeOptions.yesterday|Yesterday',
    dateFormat: 'MMM DD',
    getRange: (tz?: string) => getDayBounds(-1, tz),
  },
  {
    value: 'This week',
    label: 'defaults.dateRangeOptions.thisWeek|This week',
    dateFormat: 'MMM DD',
    getRange: (tz?: string) => getWeekBounds(0, tz),
  },
  {
    value: 'Last week',
    label: 'defaults.dateRangeOptions.lastWeek|Last week',
    dateFormat: 'MMM DD',
    getRange: (tz?: string) => getWeekBounds(-1, tz),
  },
  {
    value: 'Week to date',
    label: 'defaults.dateRangeOptions.weekToDate|Week to date',
    dateFormat: 'MMM DD',
    getRange: (tz?: string) => getUnitToDate('isoWeek', tz),
  },
  {
    value: 'Last 7 days',
    label: 'defaults.dateRangeOptions.last7Days|Last 7 days',
    dateFormat: 'MMM DD',
    getRange: (tz?: string) => getLastNDays(7, tz),
  },
  {
    value: 'Next 7 days',
    label: 'defaults.dateRangeOptions.next7Days|Next 7 days',
    dateFormat: 'MMM DD',
    getRange: (tz?: string) => getNextNDays(7, tz),
  },
  {
    value: 'Last 30 days',
    label: 'defaults.dateRangeOptions.last30Days|Last 30 days',
    dateFormat: 'MMM DD',
    getRange: (tz?: string) => getLastNDays(30, tz),
  },
  {
    value: 'Next 30 days',
    label: 'defaults.dateRangeOptions.next30Days|Next 30 days',
    dateFormat: 'MMM DD',
    getRange: (tz?: string) => getNextNDays(30, tz),
  },
  {
    value: 'This month',
    label: 'defaults.dateRangeOptions.thisMonth|This month',
    dateFormat: 'MMM YYYY',
    getRange: (tz?: string) => getMonthBounds(0, tz),
  },
  {
    value: 'Last month',
    label: 'defaults.dateRangeOptions.lastMonth|Last month',
    dateFormat: 'MMM YYYY',
    getRange: (tz?: string) => getMonthBounds(-1, tz),
  },
  {
    value: 'Next month',
    label: 'defaults.dateRangeOptions.nextMonth|Next month',
    dateFormat: 'MMM YYYY',
    getRange: (tz?: string) => getMonthBounds(1, tz),
  },
  {
    value: 'This quarter',
    label: 'defaults.dateRangeOptions.thisQuarter|This quarter',
    dateFormat: 'MMM YYYY',
    getRange: (tz?: string) => getQuarterBounds(0, tz),
  },
  {
    value: 'Last quarter',
    label: 'defaults.dateRangeOptions.lastQuarter|Last quarter',
    dateFormat: 'MMM YYYY',
    getRange: (tz?: string) => getQuarterBounds(-1, tz),
  },
  {
    value: 'Next quarter',
    label: 'defaults.dateRangeOptions.nextQuarter|Next quarter',
    dateFormat: 'MMM YYYY',
    getRange: (tz?: string) => getQuarterBounds(1, tz),
  },
  {
    value: 'Quarter to date',
    label: 'defaults.dateRangeOptions.quarterToDate|Quarter to date',
    dateFormat: 'MMM YYYY',
    getRange: (tz?: string) => getUnitToDate('quarter', tz),
  },
  {
    value: 'Last 6 months',
    label: 'defaults.dateRangeOptions.last6Months|Last 6 months',
    dateFormat: 'MMM YYYY',
    getRange: (tz?: string) => getLastNMonths(6, tz),
  },
  {
    value: 'Last 12 months',
    label: 'defaults.dateRangeOptions.last12Months|Last 12 months',
    dateFormat: 'MMM YYYY',
    getRange: (tz?: string) => getLastNMonths(12, tz),
  },
  {
    value: 'This year',
    label: 'defaults.dateRangeOptions.thisYear|This year',
    dateFormat: 'YYYY',
    getRange: (tz?: string) => getYearBounds(0, tz),
  },
  {
    value: 'Last year',
    label: 'defaults.dateRangeOptions.lastYear|Last year',
    dateFormat: 'YYYY',
    getRange: (tz?: string) => getYearBounds(-1, tz),
  },
  {
    value: 'Next year',
    label: 'defaults.dateRangeOptions.nextYear|Next year',
    dateFormat: 'YYYY',
    getRange: (tz?: string) => getYearBounds(1, tz),
  },
  {
    value: 'Year to date',
    label: 'defaults.dateRangeOptions.yearToDate|Year to date',
    dateFormat: 'MMM YYYY',
    getRange: (tz?: string) => getUnitToDate('year', tz),
  },
];
