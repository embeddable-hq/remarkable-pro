import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { ChartData, ChartOptions } from 'chart.js';
import {
  getDatalabelPercentage,
  getDimensionWithoutTruncation,
  groupTailAsOther,
  MeasureTotals,
} from '../charts.utils';
import { Theme } from '../../../theme/theme.types';
import { remarkableTheme } from '../../../theme/theme.constants';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { getDimensionMeasureColor } from '../../../theme/styles/styles.utils';
import { getChartColors, ChartClickArgs } from '@embeddable.com/remarkable-ui';
import { PieChartClickArg } from './pies.types';
import { getTimeRangeFromDimensionValue } from '../../utils/dimension.utils';
import { i18n } from '../../../theme/i18n/i18n';

export const createPieClickHandler = ({
  results,
  dimension,
  onClicked,
}: {
  results: DataResponse;
  dimension: Dimension;
  onClicked?: (args: PieChartClickArg) => void;
}): ((args: ChartClickArgs) => void) => {
  return ({ elementAtEvent }) => {
    const element = elementAtEvent[0];
    if (!element) return;
    const dimensionValue = results.data?.[element.index]?.[dimension.name] as string | undefined;
    const dimensionTimeRange = getTimeRangeFromDimensionValue({ value: dimensionValue, dimension });
    onClicked?.({ dimensionValue, dimensionTimeRange });
  };
};

export const getPieChartProData = (
  props: {
    data: DataResponse['data'];
    dimension: Dimension;
    measure: Measure;
    maxLegendItems?: number;
    measureTotals?: MeasureTotals;
  },
  theme: Theme = remarkableTheme,
): ChartData<'pie'> => {
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
    props.measureTotals,
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

  const themeFormatter = getThemeFormatter(theme);

  return {
    labels: groupedData.map((item) => {
      const value = item[props.dimension.name];
      const formattedValue = themeFormatter.data(
        getDimensionWithoutTruncation(props.dimension),
        value,
      );

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
  props: { measure: Measure; dimension: Dimension },
  theme: Theme = remarkableTheme,
): Partial<ChartOptions<'pie'>> => {
  const { dimension, measure } = props;
  const themeFormatter = getThemeFormatter(theme);
  const decimalPlaces = measure.inputs?.decimalPlaces;

  return {
    plugins: {
      legend: {
        position: theme.charts.legendPosition ?? 'bottom',
        labels: {
          generateLabels: (chart) => {
            const labels = chart.data.labels ?? [];
            const labelColor = chart.options.plugins?.legend?.labels?.color as string | undefined;
            return labels.map((label, i) => {
              const meta = chart.getDatasetMeta(0);
              const style = meta.controller.getStyle(i, false);
              return {
                text: themeFormatter.data(dimension, label as string),
                fillStyle: style.backgroundColor as string,
                strokeStyle: style.borderColor as string,
                lineWidth: style.borderWidth,
                hidden: !chart.getDataVisibility(i),
                index: i,
                fontColor: labelColor,
              };
            });
          },
        },
      },
      datalabels: {
        formatter: (value: string | number, context) => {
          if (measure.inputs?.showValueAsPercentage) {
            return getDatalabelPercentage(Number(value), context.dataset.data, decimalPlaces);
          }
          return themeFormatter.data(measure, value);
        },
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const label = context[0]?.label;
            return themeFormatter.data(getDimensionWithoutTruncation(dimension), label);
          },
          label(context) {
            const raw = context.raw as number;
            return `${themeFormatter.data(measure, raw)} (${getDatalabelPercentage(raw, context.dataset.data, decimalPlaces)})`;
          },
        },
      },
    },
  };
};
