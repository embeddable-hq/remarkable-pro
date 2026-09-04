import { DataResponse, Dimension, TimeRange } from '@embeddable.com/core';
import dayjs, { QUnitType } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import { Theme } from '../../theme/theme.types';
import { useTheme } from '@embeddable.com/react';
import { useMemo } from 'react';
import quarterOfYear from 'dayjs/plugin/quarterOfYear.js';
import { defaultGranularitySelectFieldOptions } from '../../theme/defaults/defaults.GranularityOptions.constants';

dayjs.extend(utc);
dayjs.extend(isoWeek);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(quarterOfYear);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataRecord = { [key: string]: any };

// A `from`/`to` bound reaching this hook is either a Date whose UTC-read digits
// already equal the intended local wall-clock time (the day-precision date-range
// presets and the custom range picker build these deliberately, so they line up
// with how Cube returns record values for a given query timezone), or a genuine
// real instant (e.g. a live/rolling range) that needs an actual timezone
// conversion to land on those same local digits. The two can't be told apart from
// the value alone, except that every existing local-digits-as-UTC bound sits
// exactly on a clean unit boundary (00:00:00.000 or 23:59:59.999), while a genuine
// live instant essentially never does by coincidence.
const isCleanBoundary = (value: dayjs.Dayjs): boolean => {
  const isStartOfDay =
    value.hour() === 0 && value.minute() === 0 && value.second() === 0 && value.millisecond() === 0;
  const isEndOfDay =
    value.hour() === 23 &&
    value.minute() === 59 &&
    value.second() === 59 &&
    value.millisecond() === 999;
  return isStartOfDay || isEndOfDay;
};

const resolveBoundary = (rawValue: unknown, tz?: string): dayjs.Dayjs => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const asUtc = dayjs.utc(rawValue as any);
  const isGenuineInstant = rawValue instanceof Date && tz && !isCleanBoundary(asUtc);

  if (!isGenuineInstant) {
    return asUtc;
  }

  return dayjs.utc(
    dayjs(rawValue as Date)
      .tz(tz)
      .format('YYYY-MM-DDTHH:mm:ss.SSS'),
  );
};

type UseFillGapsProps = {
  results: DataResponse | undefined;
  dimension: Dimension;
  orderDirection?: 'asc' | 'desc';
  externalDateBounds?: TimeRange;
};

export function useFillGaps(props: UseFillGapsProps): DataResponse {
  const theme = useTheme() as Theme;
  const { results, dimension, orderDirection = 'asc', externalDateBounds } = props;

  const processed = useMemo(() => {
    const granularity = dimension.inputs?.granularity;
    const dimensionName = dimension.name;
    const dateBoundsTmp: TimeRange = dimension.inputs?.dateBounds;
    const ignoreEmptyDate: boolean = dimension.inputs?.ignoreEmptyDate ?? false;

    const knownGranularities = defaultGranularitySelectFieldOptions.map(
      (opt) => opt.value as string,
    );

    if (
      !granularity ||
      !knownGranularities.includes(granularity) ||
      !dimensionName ||
      !results ||
      results.isLoading ||
      results.data?.length === 0
    ) {
      return results;
    }

    const dateBounds = dateBoundsTmp?.relativeTimeString
      ? theme.defaults.dateRangesOptions
          .find((option) => option.value === dateBoundsTmp?.relativeTimeString)
          ?.getRange(theme.clientContext.timezone)
      : dateBoundsTmp;

    if (dimension.nativeType !== 'time') return results;

    const sortedResults = [...(results?.data ?? [])].sort((a, b) => {
      const aVal = a[dimensionName];
      const bVal = b[dimensionName];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      return dayjs.utc(aVal).diff(dayjs.utc(bVal));
    });

    // Determine the full date range even if data is empty
    const from = resolveBoundary(
      externalDateBounds?.from ?? dateBounds?.from ?? sortedResults[0]?.[dimensionName],
      theme.clientContext.timezone,
    );

    const to = resolveBoundary(
      externalDateBounds?.to ??
        dateBounds?.to ??
        sortedResults[sortedResults.length - 1]?.[dimensionName] ??
        [...sortedResults].reverse().find((item) => item?.[dimensionName] != null)?.[dimensionName],
      theme.clientContext.timezone,
    );

    // If we *still* don’t have valid date bounds, bail out safely
    if (!from.isValid() || !to.isValid()) {
      return { ...results, data: [] };
    }

    const recordsByDate = new Map<string, DataRecord[]>();
    for (const record of sortedResults) {
      const value = record[dimensionName];
      if (value == null) continue;
      const key = dayjs.utc(value).toISOString().split('Z')[0]!;
      const arr = recordsByDate.get(key) ?? [];
      arr.push(record);
      recordsByDate.set(key, arr);
    }

    const filled: DataRecord[] = [];
    let current = from.startOf((granularity === 'week' ? 'isoWeek' : granularity) as QUnitType);

    while (current.isSameOrBefore(to)) {
      const key = current.toISOString().split('Z')[0]!;
      const records = recordsByDate.get(key);

      if (records && records.length > 0) {
        filled.push(...records);
      } else if (!ignoreEmptyDate) {
        filled.push({ [dimensionName]: key });
      }

      current = current.add(1, granularity as QUnitType);
    }

    if (orderDirection === 'desc') {
      filled.reverse();
    }

    return {
      ...results,
      data: filled,
    };
  }, [results, dimension, orderDirection, theme, externalDateBounds]);

  return processed as DataResponse;
}
