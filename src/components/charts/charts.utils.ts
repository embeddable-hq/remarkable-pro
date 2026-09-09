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

export const groupTailAsOther = (
  data: DataResponse['data'] = [],
  dimension: Dimension,
  measures: Measure[],
  maxItems?: number,
) => {
  if (!maxItems || data.length <= maxItems) return data;

  const head = data.slice(0, maxItems - 1);
  const tail = data.slice(maxItems - 1);

  const aggregatedRow: Record<string, unknown> = {
    [dimension.name]: i18n.t('common.other'),
  };

  for (const measure of measures) {
    const vals = tail.map((row) => Number.parseFloat(row[measure.name] ?? '0'));
    const aggType = (measure.meta as Record<string, unknown> | undefined)?.aggType;

    switch (aggType) {
      case 'avg':
        aggregatedRow[measure.name] = vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
        break;
      case 'min':
        aggregatedRow[measure.name] = Math.min(...vals);
        break;
      case 'max':
        aggregatedRow[measure.name] = Math.max(...vals);
        break;
      default:
        aggregatedRow[measure.name] = vals.reduce((s, v) => s + v, 0);
    }
  }

  return [...head, aggregatedRow];
};

// Measures whose aggType is avg/min/max can't be correctly represented by a
// NOT-IN "everything else" aggregate — you can't derive the average/min/max of
// the excluded groups from anything server-aggregatable without re-computing
// over row-level data. Group "Other" bucketing is limited to sum/count.
export const isOtherBucketableMeasure = (measure: Measure): boolean => {
  const aggType = (measure.meta as Record<string, unknown> | undefined)?.aggType;
  return aggType !== 'avg' && aggType !== 'min' && aggType !== 'max';
};

export const tagRowsAsOtherGroup = (
  data: DataResponse['data'],
  groupBy: Dimension,
): NonNullable<DataResponse['data']> => {
  const groupByFieldName = getDimensionFieldName(groupBy);
  return (data ?? []).map((row) => ({ ...row, [groupByFieldName]: i18n.t('common.other') }));
};

// Merges the top-N-groups query with the "Other" aggregate query. The two are
// independent async calls that can resolve in either order — critically, the
// "Other" rows are only spliced in once mainResults has actually settled
// (isLoading: false). Without that gate, a render where resultsGroupOther has
// arrived but mainResults hasn't yet would produce a merged dataset containing
// ONLY the Other row, placing it at index 0. Per-value chart colors are cached
// by value and reused forever once assigned (see getDimensionMeasureColor), so
// "Other" would permanently keep index 0's color — then collide with whichever
// real group value later computes at index 0 once mainResults finally arrives.
export const mergeGroupOtherResults = (
  mainResults: DataResponse | undefined,
  resultsGroupOther: DataResponse | undefined,
  groupBy: Dimension,
): DataResponse | undefined => {
  if (!mainResults) return mainResults;

  const mainIsSettled = !mainResults.isLoading;

  return {
    ...mainResults,
    isLoading: mainResults.isLoading || Boolean(resultsGroupOther?.isLoading),
    error: mainResults.error || resultsGroupOther?.error,
    data: [
      ...(mainResults.data ?? []),
      ...(mainIsSettled ? tagRowsAsOtherGroup(resultsGroupOther?.data, groupBy) : []),
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
