import { ChartClickArgs } from '@embeddable.com/remarkable-ui';
import { Dimension, Granularity, TimeRange } from '@embeddable.com/core';
import { getTimeRangeFromDimensionValue } from '../utils/dimension.utils';

type ChartData = { labels?: unknown[]; datasets?: unknown[] };

type SimpleClickArg = {
  dimensionValue: string | undefined;
  dimensionTimeRange: TimeRange | undefined;
};

type GroupedClickArg = SimpleClickArg & {
  groupingDimensionValue: string | undefined;
  groupingDimensionTimeRange: TimeRange | undefined;
};

export function createSimpleClickHandler({
  data,
  dimension,
  granularity,
  onClicked,
}: {
  data: ChartData;
  dimension: Dimension;
  granularity?: Granularity;
  onClicked?: (args: SimpleClickArg) => void;
}): (args: ChartClickArgs) => void {
  return ({ elementAtEvent }) => {
    const element = elementAtEvent[0]!;
    const dimensionValue = data?.labels?.[element?.index] as string | undefined;
    const dimensionTimeRange = getTimeRangeFromDimensionValue({
      value: dimensionValue,
      stateGranularity: granularity,
      dimension,
    });
    onClicked?.({ dimensionValue, dimensionTimeRange });
  };
}

export function createGroupedClickHandler({
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
}): (args: ChartClickArgs) => void {
  return ({ elementAtEvent }) => {
    const element = elementAtEvent[0]!;
    const dimensionValue = data?.labels?.[element?.index] as string | undefined;
    const groupingDimensionValue = (
      data?.datasets?.[element?.datasetIndex] as { rawLabel?: string } | undefined
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
}
