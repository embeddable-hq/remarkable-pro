import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { ChartData, ChartOptions } from 'chart.js';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getChartColors, getStyleNumber } from '@embeddable.com/remarkable-ui';
import { getDimensionMeasureColor } from '../../../../theme/styles/styles.utils';
import { mergician } from 'mergician';
import { isColorValid, setColorAlpha } from '../../../../utils/color.utils';
import { LineChartProOptionsClick } from '../lines.utils';

export const getLineChartProData = (
  props: {
    data: DataResponse['data'];
    dimension: Dimension;
    measures: Measure[];
    hasMinMaxYAxisRange: boolean;
  },
  theme: Theme,
): ChartData<'line'> => {
  if (!props.data) {
    return {
      labels: [],
      datasets: [{ data: [] }],
    };
  }

  const themeFormatter = getThemeFormatter(theme);

  const groupedData = props.data;

  return {
    labels: groupedData.map((item) => {
      return item[props.dimension.name];
    }),
    datasets: props.measures.map((measure, index) => {
      const zeroFill = Boolean(measure.inputs?.['connectGaps']);
      const values = groupedData.map((item) => item[measure.name] ?? (zeroFill ? 0 : null));

      const lineColor = measure.inputs?.['lineColor'];
      const chartColors = getChartColors();
      const backgroundColor = isColorValid(lineColor)
        ? lineColor
        : getDimensionMeasureColor({
            dimensionOrMeasure: measure,
            theme,
            color: 'background',
            value: measure.name,
            chartColors,
            index,
          });

      const borderColor = isColorValid(lineColor)
        ? lineColor
        : getDimensionMeasureColor({
            dimensionOrMeasure: measure,
            theme,
            color: 'border',
            value: measure.name,
            chartColors,
            index,
          });

      return {
        clip: props.hasMinMaxYAxisRange,
        label: themeFormatter.dimensionOrMeasureTitle(measure),
        data: values,
        backgroundColor: setColorAlpha(backgroundColor, 0.5),
        pointBackgroundColor: backgroundColor,
        borderDash: measure.inputs?.['dashedLine']
          ? [
              getStyleNumber('--em-linechart-line-dash', '0.25rem'),
              getStyleNumber('--em-linechart-line-gap', '0.25rem'),
            ]
          : undefined,
        borderColor,
        fill: Boolean(measure.inputs?.['fillUnderLine']),
      } as ChartData<'line'>['datasets'][number];
    }),
  };
};

export const getLineChartProOptions = (
  options: {
    dimension: Dimension;
    measures: Measure[];
    data: ChartData<'line'>;
    onLineClicked?: LineChartProOptionsClick;
  },
  theme: Theme,
): ChartOptions<'line'> => {
  const { dimension, data, measures, onLineClicked } = options;
  const themeFormatter = getThemeFormatter(theme);

  const lineChartOptions: ChartOptions<'line'> = {
    plugins: {
      datalabels: {
        labels: {
          value: {
            formatter: (value: string | number, context) => {
              if (theme.charts.avoidFormattingOnLabels) {
                return value;
              }
              const measure = measures[context.datasetIndex]!;
              return themeFormatter.data(measure, value);
            },
          },
        },
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const label = context[0]?.label;
            const displayValue = theme.charts.avoidFormattingOnTooltip
              ? label
              : themeFormatter.data(dimension, label);
            return displayValue;
          },
          label: (context) => {
            const measure = measures[context.datasetIndex]!;
            const raw = context.raw as number;

            return `${theme.charts.avoidFormattingOnTooltip ? context.dataset.label : themeFormatter.data(dimension, context.dataset.label) || ''}: ${theme.charts.avoidFormattingOnTooltip ? raw : themeFormatter.data(measure, raw)}`;
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
            const displayValue = theme.charts.avoidFormattingOnXAxis
              ? label
              : themeFormatter.data(dimension, label);
            return displayValue;
          },
        },
      },
      y: {
        ticks: {
          callback: (value) => {
            const displayValue = theme.charts.avoidFormattingOnYAxis
              ? value
              : themeFormatter.data(measures[0]!, value);
            return displayValue;
          },
        },
      },
    },
    onClick: (_event, elements, chart) => {
      if (!onLineClicked) return;

      const element = elements[0];
      const dimensionValue = (element ? chart.data.labels![element.index] : null) as string | null;

      onLineClicked({
        dimensionValue,
      });
    },
  };

  return mergician(lineChartOptions, theme.charts?.lineChartDefaultPro?.options || {});
};
