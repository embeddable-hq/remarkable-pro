import { TimeRange } from '@embeddable.com/core';
import { Theme } from '../../theme/theme.types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

export const getTimeRangeFromTo = (receivedTimeRange: TimeRange, theme: Theme): TimeRange => {
  return receivedTimeRange?.relativeTimeString
    ? (theme.defaults.dateRangesOptions
        .find((dateRange) => dateRange.value === receivedTimeRange?.relativeTimeString)
        ?.getRange() as TimeRange)
    : receivedTimeRange;
};

export const getTimeRangeLabel = (range: TimeRange, dateFormat: string): string => {
  if (!range) {
    return '';
  }

  const { from, to } = range;

  if (!from || !to) {
    return '';
  }

  const currentUTCYear = new Date().getUTCFullYear();

  const isDifferentYear =
    currentUTCYear !== from.getUTCFullYear() || currentUTCYear !== to.getUTCFullYear();

  const format = isDifferentYear ? 'DD MMM YYYY' : dateFormat;

  const labelFrom = dayjs(from).utc().format(format);
  const labelTo = dayjs(to).utc().format(format);

  if (labelFrom === labelTo) {
    return labelFrom;
  }

  return `${labelFrom} - ${labelTo}`;
};
