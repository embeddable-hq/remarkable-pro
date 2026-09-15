import { ChartClickArgs } from '@embeddable.com/remarkable-ui';
import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import { getTimeRangeFromDimensionValue } from '../utils/dimension.utils';
import { dispatchEventUserInteraction } from '../../utils/events.utils';
import { i18n } from '../../theme/i18n/i18n';
import { DimensionValueOrTimeRange, GroupedClickArg, SimpleClickArg } from './charts.types';
import { ChartData } from 'chart.js';
import { getDimensionFieldName } from '../../utils/data.utils';

export const getDimensionWithoutTruncation = (dimension: Dimension): Dimension => ({
  ...dimension,
  inputs: { ...dimension.inputs, maxCharacters: null },
});

const aggregateMeasureValues = (vals: number[], aggType: unknown): number => {
  switch (aggType) {
    case 'avg':
      return vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
    case 'min':
      return Math.min(...vals);
    case 'max':
      return Math.max(...vals);
    default:
      return vals.reduce((s, v) => s + v, 0);
  }
};

export const groupTailAsOther = (
  data: DataResponse['data'],
  dimension: Dimension,
  measures: Measure[],
  maxItems?: number,
) => {
  const rows = data ?? [];
  if (!maxItems || rows.length <= maxItems) return rows;

  const head = rows.slice(0, maxItems - 1);
  const tail = rows.slice(maxItems - 1);

  const aggregatedRow: Record<string, unknown> = {
    [dimension.name]: i18n.t('common.other'),
  };

  for (const measure of measures) {
    const vals = tail.map((row) => Number.parseFloat(row[measure.name] ?? '0'));
    const aggType = (measure.meta as Record<string, unknown> | undefined)?.aggType;
    aggregatedRow[measure.name] = aggregateMeasureValues(vals, aggType);
  }

  return [...head, aggregatedRow];
};

// Grouped-chart equivalent of groupTailAsOther: the source data has one row
// per (axis, group) pair rather than one row per axis value, so the tail
// can't be sliced by row count or collapsed into a single row — each group
// needs its own "Other" point so its line stays continuous. Ranks axis
// values by first appearance in `data` (no server-side ordering exists for
// this chart, same caveat as groupTailAsOther) and, once the axis tail is
// determined, aggregates each group's tail values into one synthetic row per
// group, tagged with the "Other" axis label.
export const groupTailAsOtherPerGroup = (
  data: DataResponse['data'],
  dimension: Dimension,
  groupBy: Dimension,
  measure: Measure,
  maxItems?: number,
): NonNullable<DataResponse['data']> => {
  const rows = data ?? [];
  const axisValues = [...new Set(rows.map((row) => row[dimension.name]).filter((v) => v != null))];

  if (!maxItems || axisValues.length <= maxItems) return rows;

  const headAxisValues = new Set(axisValues.slice(0, maxItems - 1));
  const head = rows.filter((row) => headAxisValues.has(row[dimension.name]));
  const tail = rows.filter(
    (row) => row[dimension.name] != null && !headAxisValues.has(row[dimension.name]),
  );

  const groupValues = [...new Set(tail.map((row) => row[groupBy.name]).filter((v) => v != null))];
  const aggType = (measure.meta as Record<string, unknown> | undefined)?.aggType;

  const otherRows = groupValues.map((groupValue) => {
    const vals = tail
      .filter((row) => row[groupBy.name] === groupValue)
      .map((row) => Number.parseFloat(row[measure.name] ?? '0'));

    return {
      [dimension.name]: i18n.t('common.other'),
      [groupBy.name]: groupValue,
      [measure.name]: aggregateMeasureValues(vals, aggType),
    };
  });

  return [...head, ...otherRows];
};

// Only sum/count (or an unset aggType, which behaves as sum — see
// groupTailAsOther's default case) are additive across groups, so only those
// are safe for computeOtherRows' grandTotal-minus-kept-groups subtraction.
// This is deliberately an allowlist, not a blocklist of avg/min/max: aggType
// can also be count_distinct/count_distinct_approx, and those aren't
// additive either — a value counted under more than one group would be
// counted once per group it appears in, so summing per-group distinct counts
// and subtracting from a grand total doesn't recover "the excluded groups'
// distinct count." Any other/future aggType is rejected by default too,
// rather than silently assumed safe.
export const isOtherBucketableMeasure = (measure: Measure): boolean => {
  const aggType = (measure.meta as Record<string, unknown> | undefined)?.aggType;
  return aggType == null || aggType === 'sum' || aggType === 'count';
};

export const tagRowsAsOtherGroup = (
  data: DataResponse['data'],
  groupBy: Dimension,
): NonNullable<DataResponse['data']> => {
  const groupByFieldName = getDimensionFieldName(groupBy);
  return (data ?? []).map((row) => ({ ...row, [groupByFieldName]: i18n.t('common.other') }));
};

const sumMeasureByAxis = (
  data: DataResponse['data'],
  axisFieldName: string,
  measureFieldName: string,
): Map<unknown, number> => {
  const totals = new Map<unknown, number>();
  for (const row of data ?? []) {
    const axisValue = row[axisFieldName];
    if (axisValue == null) continue;
    const current = totals.get(axisValue) ?? 0;
    totals.set(axisValue, current + Number.parseFloat(row[measureFieldName] ?? '0'));
  }
  return totals;
};

// Computes "Other" rows by subtraction — grandTotal[axis] minus the sum of
// the kept groups' contributions for that axis, from mainResults (the
// top-N-kept-groups query) and grandTotalData (a groupBy-agnostic total per
// axis bucket, see loadDataResultsGroupOther). Clamped to 0 to guard against
// floating-point noise producing a tiny negative value rather than an exact
// zero. See the comment on loadDataResultsGroupOther for why subtraction is
// used instead of an exclusion filter operator.
export const computeOtherRows = (
  mainData: DataResponse['data'],
  grandTotalData: DataResponse['data'],
  axis: Dimension,
  measure: Measure,
  groupBy: Dimension,
): NonNullable<DataResponse['data']> => {
  if (!grandTotalData?.length) return [];

  const keptTotals = sumMeasureByAxis(mainData, axis.name, measure.name);

  const otherRows = grandTotalData
    .filter((row) => row[axis.name] != null)
    .map((row) => {
      const grandTotal = Number.parseFloat(row[measure.name] ?? '0');
      const keptTotal = keptTotals.get(row[axis.name]) ?? 0;
      return { ...row, [measure.name]: Math.max(grandTotal - keptTotal, 0) };
    });

  return tagRowsAsOtherGroup(otherRows, groupBy);
};

// Merges the top-N-groups query with the "Other" aggregate query. The two are
// independent async calls that can resolve in either order — critically, the
// "Other" rows are only computed/spliced in once BOTH mainResults and
// resultsGroupOther have actually settled (isLoading: false on each).
// Checking only mainResults isn't enough: if the data layer keeps a query's
// previous data visible while it re-fetches (common in cache-backed
// loaders), resultsGroupOther.data could be stale from an earlier
// configuration while still reporting isLoading: true, and mainResults
// having settled says nothing about that. Without this gate, a render could
// either (a) under the old tag-based approach, produce a merged dataset
// containing ONLY the Other row, placing it at index 0 — or (b), under
// subtraction, treat "kept totals" as all-zero and so massively over-count
// Other, or compute Other from stale grand totals against fresh kept-group
// data. Per-value chart colors are cached by value and reused forever once
// assigned (see getDimensionMeasureColor), so a bad intermediate render can
// permanently pollute a color/value — waiting on both queries avoids all of
// these failure modes. This mirrors the same "never trust .data while
// .isLoading is true" rule already used in
// useUpdateAxisOrderAndCacheKey/useUpdateGroupOrderAndCacheKey.
export const mergeGroupOtherResults = (
  mainResults: DataResponse | undefined,
  resultsGroupOther: DataResponse | undefined,
  groupBy: Dimension,
  axis: Dimension,
  measure: Measure,
): DataResponse | undefined => {
  if (!mainResults) return mainResults;

  const bothSettled = !mainResults.isLoading && !resultsGroupOther?.isLoading;

  return {
    ...mainResults,
    isLoading: mainResults.isLoading || Boolean(resultsGroupOther?.isLoading),
    error: mainResults.error || resultsGroupOther?.error,
    data: [
      ...(mainResults.data ?? []),
      ...(bothSettled
        ? computeOtherRows(mainResults.data, resultsGroupOther?.data, axis, measure, groupBy)
        : []),
    ],
  };
};

export const getDatalabelPercentage = (
  value: number,
  data: unknown[],
  decimalPlaces = 2,
): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const total = data.reduce((sum: number, v: any) => sum + Number.parseFloat(v), 0);
  if (total === 0) return '0%';
  return `${Number.parseFloat(((value / total) * 100).toFixed(decimalPlaces))}%`;
};

export const createSimpleClickHandler = ({
  data,
  dimension,
  measures,
  granularity,
  componentName,
  trackingId,
  onClicked,
}: {
  data: ChartData;
  dimension: Dimension;
  measures?: Measure[];
  granularity?: Granularity;
  componentName?: string;
  trackingId?: string;
  onClicked?: (args: SimpleClickArg) => void;
}): ((args: ChartClickArgs) => void) => {
  return ({ elementAtEvent }) => {
    const element = elementAtEvent[0];
    if (!element) return;

    let dimensionValue = data?.labels?.[element.index] as string | undefined;
    const dimensionTimeRange = getTimeRangeFromDimensionValue({
      value: dimensionValue,
      stateGranularity: granularity,
      dimension,
    });
    let dimensionValueOrTimeRange: DimensionValueOrTimeRange = dimensionValue;
    if (dimensionTimeRange) {
      dimensionValue = undefined;
      dimensionValueOrTimeRange = dimensionTimeRange;
    }
    const measureValues = (measures ?? []).reduce<Record<string, unknown>>(
      (acc, measure, index) => {
        acc[measure.name] = data?.datasets?.[index]?.data?.[element.index];
        return acc;
      },
      {},
    );
    dispatchEventUserInteraction({
      componentName,
      trackingId,
      dimension,
      dimensionValue: dimensionValueOrTimeRange,
      measures,
      measureValues,
    });
    onClicked?.({ dimensionValue, dimensionTimeRange, measureValues });
  };
};

export const createGroupedClickHandler = ({
  data,
  dimension,
  measure,
  groupBy,
  granularity,
  componentName,
  trackingId,
  onClicked,
}: {
  data: ChartData;
  dimension: Dimension;
  measure?: Measure;
  groupBy: Dimension;
  granularity?: Granularity;
  componentName?: string;
  trackingId?: string;
  onClicked?: (args: GroupedClickArg) => void;
}): ((args: ChartClickArgs) => void) => {
  return ({ elementAtEvent }) => {
    const element = elementAtEvent[0];

    if (!element) return;

    let dimensionValue = data?.labels?.[element.index] as string | undefined;

    const groupingDimensionValue = (
      data?.datasets?.[element.datasetIndex] as { rawLabel?: string } | undefined
    )?.rawLabel;

    const dimensionTimeRange = getTimeRangeFromDimensionValue({
      value: dimensionValue,
      stateGranularity: granularity,
      dimension,
    });

    let dimensionValueOrTimeRange: DimensionValueOrTimeRange = dimensionValue;
    if (dimensionTimeRange) {
      dimensionValue = undefined;
      dimensionValueOrTimeRange = dimensionTimeRange;
    }

    const groupingDimensionTimeRange = getTimeRangeFromDimensionValue({
      value: groupingDimensionValue,
      dimension: groupBy,
    });

    let dimensionGroupByValueOrTimeRange: DimensionValueOrTimeRange = groupingDimensionValue;
    if (groupingDimensionTimeRange) {
      dimensionGroupByValueOrTimeRange = groupingDimensionTimeRange;
    }

    const measureValue = data?.datasets?.[element.datasetIndex]?.data?.[element.index];

    dispatchEventUserInteraction({
      componentName,
      trackingId,
      dimension,
      dimensionValue: dimensionValueOrTimeRange,
      dimensionGroupBy: groupBy,
      dimensionGroupByValue: dimensionGroupByValueOrTimeRange,
      measure,
      measureValue,
    });
    onClicked?.({
      dimensionValue,
      dimensionTimeRange,
      groupingDimensionValue,
      groupingDimensionTimeRange,
    });
  };
};
