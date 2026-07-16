import { DataResponse, Dimension, Granularity, Measure, TimeRange } from '@embeddable.com/core';
import { ChartCardHeaderProps } from '../shared/ChartCard/ChartCard';

export type BarChartProOptionsClickArg = {
  dimensionValue: string | number | undefined;
  dimensionTimeRange: TimeRange | undefined;
};

export type BarChartStackedProOptionsClickArg = BarChartProOptionsClickArg & {
  groupingDimensionValue: string | undefined;
  groupingDimensionTimeRange: TimeRange | undefined;
};

export type BarChartStackedBaseProps = {
  groupBy: Dimension;
  measure: Measure;
  results?: DataResponse;
  resultsAxisOrder?: DataResponse;
  axisOrder?: string[];
  axisOrderCacheKey?: string;
  setAxisOrderAndCacheKey?: (values: string[], cacheKey: string) => void;
  showLegend?: boolean;
  showLogarithmicScale?: boolean;
  showTooltips?: boolean;
  showTotalLabels?: boolean;
  showValueLabels?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  granularity?: Granularity;
  setGranularity?: (granularity: Granularity) => void;
  onBarClicked?: (args: BarChartStackedProOptionsClickArg) => void;
  componentName?: string;
  trackingId?: string;
} & ChartCardHeaderProps;

export type BarChartBaseProps = {
  dimension: Dimension;
  measures: Measure[];
  results: DataResponse;
  showLegend?: boolean;
  showLogarithmicScale?: boolean;
  showTooltips?: boolean;
  showValueLabels?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  granularity?: Granularity;
  setGranularity?: (granularity: Granularity) => void;
  onBarClicked?: (args: BarChartProOptionsClickArg) => void;
  componentName?: string;
  trackingId?: string;
} & ChartCardHeaderProps;
