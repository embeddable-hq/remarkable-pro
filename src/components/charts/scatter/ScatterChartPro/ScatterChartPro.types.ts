import { TimeRange } from '@embeddable.com/core';

export type ScatterChartProOptionsClickArg = {
  xMeasureValue: string;
  yMeasureValue: string;
  pointDimensionValue: string;
  groupByDimensionValue: string | null;
  pointDimensionTimeRange: TimeRange;
  groupByDimensionTimeRange: TimeRange;
};
