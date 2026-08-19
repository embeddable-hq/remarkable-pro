import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { ChartCardHeaderProps } from '../shared/ChartCard/ChartCard';

export type FunnelPalette = { start: string; end: string };

export type DefaultFunnelChartProps = {
  stageDimension: Dimension;
  countMeasure: Measure;
  orderDimension?: Dimension;
  colorScheme?: string;
  startColor?: string;
  endColor?: string;
  results: DataResponse;
  showLegend?: boolean;
  showTooltips?: boolean;
  showCount?: boolean;
  showPercentages?: boolean;
} & ChartCardHeaderProps;
