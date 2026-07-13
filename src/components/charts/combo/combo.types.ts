import { DataResponse, Dimension, Granularity, Measure, TimeRange } from '@embeddable.com/core';
import { ChartCardHeaderProps } from '../shared/ChartCard/ChartCard';

export type BarLineChartProClickArg = {
  dimensionValue: string | undefined;
  dimensionTimeRange: TimeRange | undefined;
};

export type BarLineChartProProps = {
  dimension: Dimension;
  measures: Measure[];
  lineMeasures?: Measure[];
  results: DataResponse;
  resultsOtherTotal?: DataResponse;
  showLegend?: boolean;
  showLogarithmicScale?: boolean;
  showTooltips?: boolean;
  showValueLabels?: boolean;
  showValueLabelsLine?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  yAxisRangeMin?: number;
  yAxisRangeMax?: number;
  reverseXAxis?: boolean;
  xAxisMaxItems?: number;
  yAxisSecondaryLabel?: string;
  yAxisSecondaryMin?: number;
  yAxisSecondaryMax?: number;
  granularity?: Granularity;
  setGranularity?: (granularity: Granularity) => void;
  onBarClicked?: (args: BarLineChartProClickArg) => void;
  onLineClicked?: (args: BarLineChartProClickArg) => void;
} & ChartCardHeaderProps;
