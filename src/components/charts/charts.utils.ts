import { ChartClickArgs } from '@embeddable.com/remarkable-ui';
import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import { getTimeRangeFromDimensionValue } from '../utils/dimension.utils';
import { dispatchEventUserInteraction } from '../../utils/events.utils';
import { i18n } from '../../theme/i18n/i18n';
import { GroupedClickArg, SimpleClickArg } from './charts.types';
import { ChartData } from 'chart.js';

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
    if (dimensionTimeRange) {
      dimensionValue = undefined;
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
      dimensionValue,
      dimensionTimeRange,
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

    if (dimensionTimeRange) {
      dimensionValue = undefined;
    }

    const groupingDimensionTimeRange = getTimeRangeFromDimensionValue({
      value: groupingDimensionValue,
      dimension: groupBy,
    });

    const measureValue = data?.datasets?.[element.datasetIndex]?.data?.[element.index];

    dispatchEventUserInteraction({
      componentName,
      trackingId,
      dimension,
      dimensionValue,
      dimensionTimeRange,
      dimensionGroupBy: groupBy,
      dimensionGroupByValue: groupingDimensionValue,
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
