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
dayjs.extend(timezone);
dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);
dayjs.extend(quarterOfYear);

// dateBounds/externalDateBounds store the picked calendar date encoded as if it were
// UTC (e.g. Aug 17 -> "2026-08-17T00:00:00.000Z"), with the real timezone meant to be
// applied wherever the range is consumed (see defaults.DateRanges.constants.ts). Reinterpret
// those UTC-anchored digits as wall-clock time in the client's timezone so the resulting
// instant lines up with the real, already timezone-bucketed data returned for the chart.
const toClientTzInstant = (date: Date | undefined, tz?: string) => {
  if (!date) return undefined;
  return tz ? dayjs.tz(dayjs.utc(date).format('YYYY-MM-DDTHH:mm:ss.SSS'), tz) : dayjs.utc(date);
};

// Sub-day buckets come back from the backend as real UTC instants, so dateBounds needs the
// same real-instant treatment to line up. Day-and-coarser buckets come back in the same
// pseudo-UTC wall-clock convention dateBounds already uses, so they must NOT be shifted.
const SUB_DAY_GRANULARITIES = new Set(['second', 'minute', 'hour']);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataRecord = { [key: string]: any };

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

    const clientTimezone = theme.clientContext.timezone;
    const isSubDayGranularity = SUB_DAY_GRANULARITIES.has(granularity);
    const toBoundary = (date: Date | undefined) =>
      date == null
        ? undefined
        : isSubDayGranularity
          ? toClientTzInstant(date, clientTimezone)
          : dayjs.utc(date);

    const explicitFrom = toBoundary(externalDateBounds?.from ?? dateBounds?.from);
    const explicitTo = toBoundary(externalDateBounds?.to ?? dateBounds?.to);

    // Determine the full date range even if data is empty
    const from = explicitFrom ?? dayjs.utc(sortedResults[0]?.[dimensionName]);

    const to =
      explicitTo ??
      dayjs.utc(
        sortedResults[sortedResults.length - 1]?.[dimensionName] ??
          [...sortedResults].reverse().find((item) => item?.[dimensionName] != null)?.[
            dimensionName
          ],
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
  }, [results, dimension, orderDirection, theme]);

  return processed as DataResponse;
}
