import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { ChartCardHeaderProps } from '../shared/ChartCard/ChartCard';

export type FunnelPalette = { start: string; end: string };

export type DefaultFunnelChartProps = {
  stageDimension: Dimension;
  countMeasure: Measure;
  orderDimension?: Dimension;
  startColor?: string;
  endColor?: string;
  results: DataResponse;
  showLegend?: boolean;
  showTooltips?: boolean;
  showPercentage?: boolean;
} & ChartCardHeaderProps;
