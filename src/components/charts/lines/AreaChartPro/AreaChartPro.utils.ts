import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { ChartData, ChartOptions } from 'chart.js';
import { mergician } from 'mergician';
import {
  getLineChartProData,
  getLineChartProOptions,
} from '../LineChartDefaultPro/LineChartDefaultPro.utils';

export const getAreaChartProData = (
  props: {
    data: DataResponse['data'];
    dimension: Dimension;
    measures: Measure[];
    hasMinMaxYAxisRange: boolean;
  },
  theme: Theme,
): ChartData<'line'> => {
  const data = getLineChartProData(props, theme);

  return {
    ...data,
    datasets: data.datasets.map((dataset) => ({ ...dataset, fill: true })),
  };
};

export const getAreaChartProOptions = (
  options: {
    dimension: Dimension;
    measures: Measure[];
    data: ChartData<'line'>;
  },
  theme: Theme,
): ChartOptions<'line'> => {
  const lineOptions = getLineChartProOptions(options, theme);

  return mergician(lineOptions, {
    scales: { y: { stacked: true } },
    ...(theme.charts?.areaChartDefaultPro?.options || {}),
  });
};
