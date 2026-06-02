import { TimeRange } from '@embeddable.com/core';

export type LineChartProOptionsClickArg = {
  dimensionValue: string | number | undefined;
  dimensionTimeRange: TimeRange | undefined;
  measureValue?: number;
};

export type LineChartGroupedProOptionsClickArg = {
  dimensionValue: string | number | undefined;
  dimensionTimeRange: TimeRange | undefined;
  groupingDimensionValue: string | boolean | undefined;
  groupingDimensionTimeRange: TimeRange | undefined;
};

export type AreaChartProPointClickArg = {
  dimensionValue: string | number | undefined;
  dimensionTimeRange: TimeRange | undefined;
  measureValue: number | undefined;
};

export type AreaChartProAreaClickArg = {
  groupingDimensionValue: string | boolean | undefined;
  groupingDimensionTimeRange: TimeRange | undefined;
};

export type LineChartProOptionsClick = (arg: LineChartProOptionsClickArg) => void;
