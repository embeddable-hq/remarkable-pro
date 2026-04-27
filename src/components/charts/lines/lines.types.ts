import { TimeRange } from '@embeddable.com/core';

export type LineChartProOptionsClickArg = {
  dimensionValue: string | number | undefined;
  dimensionTimeRange: TimeRange | undefined;
};

export type LineChartGroupedProOptionsClickArg = {
  dimensionValue: string | number | undefined;
  dimensionTimeRange: TimeRange | undefined;
  groupingDimensionValue: string | boolean | undefined;
  groupingDimensionTimeRange: TimeRange | undefined;
};

export type LineChartProOptionsClick = (arg: LineChartProOptionsClickArg) => void;
