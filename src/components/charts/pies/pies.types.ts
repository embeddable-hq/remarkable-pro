import { DataResponse, Dimension, Measure, TimeRange } from '@embeddable.com/core';
import { ChartCardHeaderProps } from '../shared/ChartCard/ChartCard';

export type PieChartClickArg = {
  dimensionValue: string | undefined;
  dimensionTimeRange: TimeRange | undefined;
};

export type DefaultPieChartProps = {
  dimension: Dimension;
  maxLegendItems?: number;
  measure: Measure;
  results: DataResponse;
  /** Full-dataset totals for the measure, used to recover a correct "Other" bucket. */
  resultsOtherTotal?: DataResponse;
  showLegend?: boolean;
  showTooltips?: boolean;
  showValueLabels?: boolean;
  showValueLabelsAsPercentage?: boolean;

  onSegmentClick?: (args: PieChartClickArg) => void;
} & ChartCardHeaderProps;
