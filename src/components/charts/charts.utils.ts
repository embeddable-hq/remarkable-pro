import { ChartClickArgs } from '@embeddable.com/remarkable-ui';
import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import { getTimeRangeFromDimensionValue } from '../utils/dimension.utils';
import { i18n } from '../../theme/i18n/i18n';
import { GroupedClickArg, SimpleClickArg } from './charts.types';
import { ChartData } from 'chart.js';

export const getDimensionWithoutTruncation = (dimension: Dimension): Dimension => ({
  ...dimension,
  inputs: { ...dimension.inputs, maxCharacters: null },
});

export type MeasureTotals = Record<string, number>;

export const groupTailAsOther = (
  data: DataResponse['data'] = [],
  dimension: Dimension,
  measures: Measure[],
  maxItems?: number,
  measureTotals?: MeasureTotals,
) => {
  if (!maxItems || data.length <= maxItems) return data;

  const head = data.slice(0, maxItems - 1);
  const tail = data.slice(maxItems - 1);

  const aggregatedRow: Record<string, unknown> = {
    [dimension.name]: i18n.t('common.other'),
  };

  for (const measure of measures) {
    const aggType = (measure.meta as Record<string, unknown> | undefined)?.aggType;
    const grandTotal = measureTotals?.[measure.name];

    if (grandTotal != null) {
      const headSum = head.reduce((s, row) => s + Number.parseFloat(row[measure.name] ?? '0'), 0);
      aggregatedRow[measure.name] = grandTotal - headSum;
      continue;
    }

    const vals = tail.map((row) => Number.parseFloat(row[measure.name] ?? '0'));

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
  granularity,
  onClicked,
}: {
  data: ChartData;
  dimension: Dimension;
  granularity?: Granularity;
  onClicked?: (args: SimpleClickArg) => void;
}): ((args: ChartClickArgs) => void) => {
  return ({ elementAtEvent }) => {
    const element = elementAtEvent[0];
    if (!element) return;
    const dimensionValue = data?.labels?.[element.index] as string | undefined;
    const dimensionTimeRange = getTimeRangeFromDimensionValue({
      value: dimensionValue,
      stateGranularity: granularity,
      dimension,
    });
    onClicked?.({ dimensionValue, dimensionTimeRange });
  };
};

export const createGroupedClickHandler = ({
  data,
  dimension,
  groupBy,
  granularity,
  onClicked,
}: {
  data: ChartData;
  dimension: Dimension;
  groupBy: Dimension;
  granularity?: Granularity;
  onClicked?: (args: GroupedClickArg) => void;
}): ((args: ChartClickArgs) => void) => {
  return ({ elementAtEvent }) => {
    const element = elementAtEvent[0];
    if (!element) return;
    const dimensionValue = data?.labels?.[element.index] as string | undefined;
    const groupingDimensionValue = (
      data?.datasets?.[element.datasetIndex] as { rawLabel?: string } | undefined
    )?.rawLabel;
    const dimensionTimeRange = getTimeRangeFromDimensionValue({
      value: dimensionValue,
      stateGranularity: granularity,
      dimension,
    });
    const groupingDimensionTimeRange = getTimeRangeFromDimensionValue({
      value: groupingDimensionValue,
      dimension: groupBy,
    });
    onClicked?.({
      dimensionValue,
      dimensionTimeRange,
      groupingDimensionValue,
      groupingDimensionTimeRange,
    });
  };
};
