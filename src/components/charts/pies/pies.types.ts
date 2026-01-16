import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { ChartCardHeaderProps } from '../shared/ChartCard/ChartCard';

export type DefaultPieChartProps = {
  dimension: Dimension;
  maxLegendItems?: number;
  measure: Measure;
  results: DataResponse;
  showLegend?: boolean;
  showTooltips?: boolean;
  showValueLabels?: boolean;

  onSegmentClick?: (args: { dimensionValue: string | null }) => void;
} & ChartCardHeaderProps;
