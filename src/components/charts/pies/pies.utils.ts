import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { ChartData, ChartOptions } from 'chart.js';
import { groupTailAsOther } from '../charts.utils';
import { Theme } from '../../../theme/theme.types';
import { remarkableTheme } from '../../../theme/theme.constants';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { getDimensionMeasureColor } from '../../../theme/styles/styles.utils';
import { getChartColors } from '@embeddable.com/remarkable-ui';
import { i18n } from '../../../theme/i18n/i18n';

export const getPieChartProData = (
  props: {
    data: DataResponse['data'];
    dimension: Dimension;
    measure: Measure;
    maxLegendItems?: number;
  },
  theme: Theme = remarkableTheme,
): ChartData<'pie'> => {
  const themeFormatter = getThemeFormatter(theme);

  if (!props.data)
    return {
      labels: [],
      datasets: [{ data: [] }],
    };

  const groupedData = groupTailAsOther(
    props.data,
    props.dimension,
    [props.measure],
    props.maxLegendItems,
  );

  const chartColors = getChartColors();
  const backgroundColor = groupedData.map((item, index) =>
    getDimensionMeasureColor({
      dimensionOrMeasure: props.dimension,
      theme,
      color: 'background',
      value: `${props.dimension.name}.${item[props.dimension.name]}`,
      chartColors,
      index,
    }),
  );

  const borderColor = groupedData.map((item, index) =>
    getDimensionMeasureColor({
      dimensionOrMeasure: props.dimension,
      theme,
      color: 'border',
      value: `${props.dimension.name}.${item[props.dimension.name]}`,
      chartColors,
      index,
    }),
  );

  return {
    labels: groupedData.map((item) => {
      const value = item[props.dimension.name];
      const formattedValue = themeFormatter.data(props.dimension, value);

      // If formatter did not work, try i18n translation
      if (value === formattedValue) {
        return i18n.t(value);
      }
      return formattedValue;
    }),
    datasets: [
      {
        data: groupedData.map((item) => item[props.measure.name]),
        backgroundColor,
        borderColor,
      },
    ],
  };
};

export const getPieChartProOptions = (
  measure: Measure,
  theme: Theme = remarkableTheme,
): Partial<ChartOptions<'pie'>> => {
  const themeFormatter = getThemeFormatter(theme);

  return {
    plugins: {
      legend: { position: theme.charts.legendPosition ?? 'bottom' },
      datalabels: {
        formatter: (value: string | number) => themeFormatter.data(measure, value),
      },
      tooltip: {
        callbacks: {
          label(context) {
            const raw = context.raw as number;
            const total = context.dataset.data.reduce(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (sum: number, v: any) => sum + parseFloat(v),
              0,
            );
            const pct = Math.round((raw / total) * 100);
            return `${themeFormatter.data(measure, raw)} (${pct}%)`;
          },
        },
      },
    },
  };
};
