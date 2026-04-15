import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { ChartData, ChartOptions } from 'chart.js';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { mergician } from 'mergician';
import { getDimensionMeasureColor } from '../../../../theme/styles/styles.utils';
import { setColorAlpha } from '../../../../utils/color.utils';
import { getChartColors } from '@embeddable.com/remarkable-ui';
import { getLineChartProOptionsOnClick, LineChartProOptionsClick } from '../lines.utils';

export const getLineChartGroupedProData = (
  props: {
    data: DataResponse['data'];
    dimension: Dimension;
    groupDimension: Dimension;
    measure: Measure;
    hasMinMaxYAxisRange: boolean;
  },
  theme: Theme,
): ChartData<'line'> => {
  const themeFormatter = getThemeFormatter(theme);
  const { data = [], dimension, groupDimension, measure, hasMinMaxYAxisRange } = props;

  const axis = [...new Set(data.map((d) => d[dimension.name]).filter((d) => d != null))].sort();
  const groupBy = [...new Set(data.map((d) => d[groupDimension.name]))].filter((d) => d != null);

  const chartColors = getChartColors();
  const datasets: ChartData<'line'>['datasets'] = groupBy.map((groupByItem, index) => {
    const backgroundColor = getDimensionMeasureColor({
      dimensionOrMeasure: groupDimension,
      theme,
      color: 'background',
      value: `${groupDimension.name}.${groupByItem}`,
      chartColors,
      index,
    });

    const borderColor = getDimensionMeasureColor({
      dimensionOrMeasure: groupDimension,
      theme,
      color: 'border',
      value: `${groupDimension.name}.${groupByItem}`,
      chartColors,
      index,
    });

    const displayLabel = theme.disableFormatting?.chart?.labels
      ? groupByItem
      : themeFormatter.data(groupDimension, groupByItem);

    const dataset = {
      clip: hasMinMaxYAxisRange,
      label: displayLabel,
      rawLabel: groupByItem,
      backgroundColor: setColorAlpha(backgroundColor, 0.5),
      pointBackgroundColor: backgroundColor,
      fill: measure.inputs?.['fillUnderLine'],
      borderColor,
      data: axis.map((axisItem) => {
        const record = data.find(
          (d) => d[groupDimension.name] === groupByItem && d[dimension.name] === axisItem,
        );
        return record?.[measure.name] ?? (measure.inputs?.['connectGaps'] ? 0 : null);
      }),
    } as ChartData<'line'>['datasets'][number];

    return dataset;
  });

  return {
    labels: axis,
    datasets,
  };
};

export const getLineChartGroupedProOptions = (
  options: {
    dimension: Dimension;
    measure: Measure;
    data: ChartData<'line'>;
    onLineClicked?: LineChartProOptionsClick;
  },
  theme: Theme,
): ChartOptions<'line'> => {
  const { dimension, data, measure, onLineClicked } = options;
  const themeFormatter = getThemeFormatter(theme);

  const lineChartOptions: ChartOptions<'line'> = {
    plugins: {
      datalabels: {
        labels: {
          value: {
            formatter: (value: string | number) => {
              const displayValue = theme.disableFormatting?.chart?.datalabels
                ? value
                : themeFormatter.data(measure, value);
              return displayValue;
            },
          },
        },
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const label = context[0]?.label;
            const displayValue = theme.disableFormatting?.chart?.tooltip
              ? label
              : themeFormatter.data(dimension, label);
            return displayValue;
          },
          label: (context) => {
            const raw = context.raw as number;
            const displayValue = theme.disableFormatting?.chart?.tooltip
              ? raw
              : themeFormatter.data(measure, raw);
            return `${context.dataset.label}: ${displayValue}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (value) => {
            if (!data || !data.labels) return undefined;

            const label = data.labels[Number(value)] as string;
            const displayValue = theme.disableFormatting?.chart?.xAxis
              ? label
              : themeFormatter.data(dimension, label);
            return displayValue;
          },
        },
      },
      y: {
        ticks: {
          callback: (value) => {
            const displayValue = theme.disableFormatting?.chart?.yAxis
              ? value
              : themeFormatter.data(measure, value);
            return displayValue;
          },
        },
      },
    },
  };

  return mergician(
    getLineChartProOptionsOnClick({ onLineClicked }),
    lineChartOptions,
    theme.charts?.lineChartGroupedPro?.options || {},
  );
};
