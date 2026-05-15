import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { ChartData, ChartOptions } from 'chart.js';
import { mergician } from 'mergician';
import {
  getLineChartGroupedProData,
  getLineChartGroupedProOptions,
} from '../LineChartGroupedPro/LineChartGroupedPro.utils';

export const getAreaChartProData = (
  props: {
    data: DataResponse['data'];
    dimension: Dimension;
    groupDimension: Dimension;
    measure: Measure;
    hasMinMaxYAxisRange: boolean;
  },
  theme: Theme,
): ChartData<'line'> => {
  const data = getLineChartGroupedProData(props, theme);

  return {
    ...data,
    datasets: data.datasets.map((dataset) => ({ ...dataset, fill: true })),
  };
};

export const getAreaChartProOptions = (
  options: {
    dimension: Dimension;
    groupDimension: Dimension;
    measure: Measure;
    data: ChartData<'line'>;
  },
  theme: Theme,
): ChartOptions<'line'> => {
  const lineOptions = getLineChartGroupedProOptions(options, theme);

  return mergician(lineOptions, {
    scales: { y: { stacked: true } },
    ...(theme.charts?.areaChartPro?.options || {}),
  });
};
