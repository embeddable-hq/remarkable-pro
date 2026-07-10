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
  /** Full-dataset totals for additive measures, used to recover a correct "Other" bucket. */
  resultsOtherTotal?: DataResponse;
  maxResults?: number;
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
