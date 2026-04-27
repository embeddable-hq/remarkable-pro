import { CUBE_DIMENSION_TYPE_TIME, Dimension, Granularity, TimeRange } from '@embeddable.com/core';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

/**
 * Constructs a TimeRange covering the full granularity bucket for a clicked time-axis bar.
 * e.g. granularity=month, value="2024-01-01" → { from: 2024-01-01T00:00:00Z, to: 2024-01-31T23:59:59Z }
 */
export const getTimeRangeFromDimensionValue = ({
  value,
  stateGranularity,
  dimension,
}: {
  value?: string;
  stateGranularity?: Granularity;
  dimension?: Dimension;
}): TimeRange => {
  if (value === undefined) {
    return undefined;
  }

  const isTimeDimension = dimension?.nativeType === CUBE_DIMENSION_TYPE_TIME;

  if (!isTimeDimension) {
    return undefined;
  }

  const granularity = stateGranularity ?? dimension?.inputs?.granularity ?? 'day';

  const d = dayjs.utc(value);
  return {
    from: d.startOf(granularity).toDate(),
    to: d.endOf(granularity).toDate(),
    relativeTimeString: undefined,
  };
};
