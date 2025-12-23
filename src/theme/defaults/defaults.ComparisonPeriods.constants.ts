import { TimeRange, TimeRangeDeserializedValue } from '@embeddable.com/core';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import quarterOfYear from 'dayjs/plugin/quarterOfYear.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);
dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

export type ComparisonPeriodOption = {
  value: string;
  label: string;
  dateFormat: string;
  getRange: (dateRange: TimeRange) => TimeRange | undefined;
};

/*--------------------*/
/*------Helpers-------*/
/*--------------------*/
function toUtcStartOfDay(d: Date): Date {
  return dayjs.utc(d).startOf('day').toDate();
}
function toUtcEndOfDay(d: Date): Date {
  return dayjs.utc(d).endOf('day').toDate();
}

// Your safe adders (note: addDaysSafe actually shifts by weeks)
function addDaysSafe(d: Date, n: number): Date {
  const newDate = new Date(d.getTime());
  newDate.setUTCDate(newDate.getUTCDate() + 7 * n);
  return newDate;
}

function addMonthsSafe(d: Date, n: number): Date {
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const day = Math.min(d.getUTCDate(), lastDay);

  return new Date(
    Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      day,
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
      d.getUTCMilliseconds(),
    ),
  );
}

const addQuartersSafe = (d: Date, n: number) => addMonthsSafe(d, n * 3);

const addYearsSafe = (d: Date, n: number) => {
  const y = d.getUTCFullYear() + n;
  const m = d.getUTCMonth();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const day = Math.min(d.getUTCDate(), lastDay);

  return new Date(
    Date.UTC(
      y,
      m,
      day,
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
      d.getUTCMilliseconds(),
    ),
  );
};

// Existing "full previous unit" options
const getPreviousPeriodRange = (primaryDateRange: TimeRange) => {
  const { from: primaryFrom, to: primaryTo } = primaryDateRange as TimeRangeDeserializedValue;
  if (!primaryFrom || !primaryTo) return undefined;

  const dateFrom = dayjs.utc(primaryFrom);
  const gapDays = dayjs.utc(primaryTo).diff(dateFrom, 'day') + 1;

  const prevTo = dateFrom.subtract(1, 'day');
  const prevFrom = prevTo.subtract(gapDays - 1, 'day');

  return {
    from: prevFrom.startOf('day').toDate(),
    to: prevTo.endOf('day').toDate(),
    relativeTimeString: '',
  };
};

const getPreviousWeekRange = (primaryDateRange: TimeRange) => {
  const { from: primaryFrom } = primaryDateRange as TimeRangeDeserializedValue;
  if (!primaryFrom) return undefined;

  const dateFrom = dayjs.utc(primaryFrom);
  const prevWeekStart = dateFrom.startOf('isoWeek').subtract(1, 'week');
  const prevWeekEnd = prevWeekStart.endOf('isoWeek');

  return {
    from: prevWeekStart.startOf('day').toDate(),
    to: prevWeekEnd.endOf('day').toDate(),
    relativeTimeString: '',
  };
};

const getPreviousMonthRange = (primaryDateRange: TimeRange) => {
  const { from: primaryFrom } = primaryDateRange as TimeRangeDeserializedValue;
  if (!primaryFrom) return undefined;

  const dateFrom = dayjs.utc(primaryFrom);
  const prevMonthStart = dateFrom.startOf('month').subtract(1, 'month');
  const prevMonthEnd = prevMonthStart.endOf('month');

  return {
    from: prevMonthStart.startOf('day').toDate(),
    to: prevMonthEnd.endOf('day').toDate(),
    relativeTimeString: '',
  };
};

const getPreviousQuarterRange = (primaryDateRange: TimeRange) => {
  const { from: primaryFrom } = primaryDateRange as TimeRangeDeserializedValue;
  if (!primaryFrom) return undefined;

  const dateFrom = dayjs.utc(primaryFrom);
  const prevQuarterStart = dateFrom.startOf('quarter').subtract(1, 'quarter');
  const prevQuarterEnd = prevQuarterStart.endOf('quarter');

  return {
    from: prevQuarterStart.startOf('day').toDate(),
    to: prevQuarterEnd.endOf('day').toDate(),
    relativeTimeString: '',
  };
};

const getPreviousYearRange = (primaryDateRange: TimeRange) => {
  const { from: primaryFrom } = primaryDateRange as TimeRangeDeserializedValue;
  if (!primaryFrom) return undefined;

  const dateFrom = dayjs.utc(primaryFrom);
  const prevYearStart = dateFrom.startOf('year').subtract(1, 'year');
  const prevYearEnd = prevYearStart.endOf('year');

  return {
    from: prevYearStart.startOf('day').toDate(),
    to: prevYearEnd.endOf('day').toDate(),
    relativeTimeString: '',
  };
};

// Same period last X options (shift both ends)
function shiftByUnit(
  range: TimeRange,
  unit: 'week' | 'month' | 'quarter' | 'year',
  dir: 1 | -1,
): TimeRange | undefined {
  const { from, to } = range as TimeRangeDeserializedValue;
  if (!from || !to) return undefined;

  const f = from;
  const t = to;

  const add = (d: Date, n: number): Date =>
    unit === 'week'
      ? addDaysSafe(d, n)
      : unit === 'month'
        ? addMonthsSafe(d, n)
        : unit === 'quarter'
          ? addQuartersSafe(d, n)
          : addYearsSafe(d, n);

  const newFrom = add(f, dir);
  const newTo = add(t, dir);

  return { from: toUtcStartOfDay(newFrom), to: toUtcEndOfDay(newTo), relativeTimeString: '' };
}

/*--------------------*/
/*---Options list-----*/
/*--------------------*/

export const defaultComparisonPeriodOptions: ComparisonPeriodOption[] = [
  // Defaults
  {
    value: 'Previous period',
    label: 'defaults.comparisonPeriodOptions.previousPeriod|Previous period',
    dateFormat: 'DD MMM YYYY',
    getRange: getPreviousPeriodRange,
  },
  {
    value: 'Previous week',
    label: 'defaults.comparisonPeriodOptions.previousWeek|Previous week',
    dateFormat: 'MMM DD',
    getRange: getPreviousWeekRange,
  },
  {
    value: 'Previous month',
    label: 'defaults.comparisonPeriodOptions.previousMonth|Previous month',
    dateFormat: 'MMM YYYY',
    getRange: getPreviousMonthRange,
  },
  {
    value: 'Previous quarter',
    label: 'defaults.comparisonPeriodOptions.previousQuarter|Previous quarter',
    dateFormat: 'MMM YYYY',
    getRange: getPreviousQuarterRange,
  },
  {
    value: 'Previous year',
    label: 'defaults.comparisonPeriodOptions.previousYear|Previous year',
    dateFormat: 'YYYY',
    getRange: getPreviousYearRange,
  },

  // Same period last X
  {
    value: 'Same period last week',
    label: 'defaults.comparisonPeriodOptions.samePeriodLastWeek|Same period last week',
    dateFormat: 'MMM DD',
    getRange: (r) => shiftByUnit(r, 'week', -1),
  },
  {
    value: 'Same period last month',
    label: 'defaults.comparisonPeriodOptions.samePeriodLastMonth|Same period last month',
    dateFormat: 'DD MMM',
    getRange: (r) => shiftByUnit(r, 'month', -1),
  },
  {
    value: 'Same period last quarter',
    label: 'defaults.comparisonPeriodOptions.samePeriodLastQuarter|Same period last quarter',
    dateFormat: 'DD MMM',
    getRange: (r) => shiftByUnit(r, 'quarter', -1),
  },
  {
    value: 'Same period last year',
    label: 'defaults.comparisonPeriodOptions.samePeriodLastYear|Same period last year',
    dateFormat: 'DD MMM YYYY',
    getRange: (r) => shiftByUnit(r, 'year', -1),
  },
];
