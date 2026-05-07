import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import { ChartData, ChartOptions } from 'chart.js';
import { mergician } from 'mergician';
import type { ChartClickArgs } from '@embeddable.com/remarkable-ui';
import { getChartColors, getStyleNumber } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../../theme/theme.types';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getDimensionMeasureColor } from '../../../../theme/styles/styles.utils';
import { isColorValid, setColorAlpha } from '../../../../utils/color.utils';
import { getDimensionWithoutTruncation, groupTailAsOther } from '../../charts.utils';
import { getBarChartProOptions } from '../../bars/bars.utils';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';
import { BarLineChartProClickArg } from '../combo.types';

export const getBarLineChartProData = (
  props: {
    data: DataResponse['data'];
    dimension: Dimension;
    measures: Measure[];
    lineMeasures: Measure[];
    maxItems?: number;
    showSecondaryAxis: boolean;
  },
  theme: Theme,
): ChartData<'bar'> => {
  if (!props.data) {
    return { labels: [], datasets: [{ data: [] }] };
  }

  const { data, dimension, measures, lineMeasures, maxItems, showSecondaryAxis } = props;
  const allMeasures = [...measures, ...lineMeasures];
  const groupedData = groupTailAsOther(data, dimension, allMeasures, maxItems);
  const themeFormatter = getThemeFormatter(theme);
  const chartColors = getChartColors();

  const labels = groupedData.map((item) => item[dimension.name]);

  const barDatasets = measures.map((measure, index) => ({
    order: 1,
    label: themeFormatter.dimensionOrMeasureTitle(measure),
    data: groupedData.map((item) => item[measure.name] ?? 0),
    backgroundColor: getDimensionMeasureColor({
      dimensionOrMeasure: measure,
      theme,
      color: 'background',
      value: measure.name,
      index,
      chartColors,
    }),
    borderColor: getDimensionMeasureColor({
      dimensionOrMeasure: measure,
      theme,
      color: 'border',
      value: measure.name,
      index,
      chartColors,
    }),
  }));

  const lineDatasets = lineMeasures.map((measure, index) => {
    const colorIndex = measures.length + index;
    const lineColor = measure.inputs?.['lineColor'];
    const zeroFill = Boolean(measure.inputs?.['connectGaps']);

    const backgroundColor = isColorValid(lineColor)
      ? lineColor
      : getDimensionMeasureColor({
          dimensionOrMeasure: measure,
          theme,
          color: 'background',
          value: measure.name,
          index: colorIndex,
          chartColors,
        });

    const borderColor = isColorValid(lineColor)
      ? lineColor
      : getDimensionMeasureColor({
          dimensionOrMeasure: measure,
          theme,
          color: 'border',
          value: measure.name,
          index: colorIndex,
          chartColors,
        });

    return {
      type: 'line' as const,
      order: 0,
      label: themeFormatter.dimensionOrMeasureTitle(measure),
      data: groupedData.map((item) => item[measure.name] ?? (zeroFill ? 0 : null)),
      backgroundColor: setColorAlpha(backgroundColor, 0.5),
      pointBackgroundColor: backgroundColor,
      borderColor,
      borderDash: measure.inputs?.['dashedLine']
        ? [
            getStyleNumber('--em-linechart-line-dash', '0.25rem'),
            getStyleNumber('--em-linechart-line-gap', '0.25rem'),
          ]
        : undefined,
      fill: Boolean(measure.inputs?.['fillUnderLine']),
      yAxisID: showSecondaryAxis && Boolean(measure.inputs?.['useSecondaryAxis']) ? 'y1' : 'y',
    };
  });

  return {
    labels,
    datasets: [...barDatasets, ...lineDatasets] as ChartData<'bar'>['datasets'],
  };
};

export const getBarLineChartProOptions = (
  options: {
    measures: Measure[];
    lineMeasures: Measure[];
    dimension: Dimension;
    data: ChartData<'bar'>;
    showSecondaryAxis: boolean;
    showValueLabels?: boolean;
    showValueLabelsLine?: boolean;
    yAxisSecondaryLabel?: string;
    yAxisSecondaryMin?: number;
    yAxisSecondaryMax?: number;
  },
  theme: Theme,
): Partial<ChartOptions<'bar'>> => {
  const {
    measures,
    lineMeasures,
    dimension,
    data,
    showSecondaryAxis,
    showValueLabels,
    showValueLabelsLine,
    yAxisSecondaryLabel,
    yAxisSecondaryMin,
    yAxisSecondaryMax,
  } = options;

  const allMeasures = [...measures, ...lineMeasures];
  const themeFormatter = getThemeFormatter(theme);

  const baseOptions = getBarChartProOptions(
    { measures, horizontal: false, data, dimension },
    theme,
  );

  const datalabelsOptions: Partial<ChartOptions<'bar'>> = {
    plugins: {
      datalabels: {
        display: (context) => {
          const isLineSeries = context.datasetIndex >= measures.length;
          const show = isLineSeries ? showValueLabelsLine : showValueLabels;
          return show && context.dataset.data[context.dataIndex] !== 0 ? 'auto' : false;
        },
        labels: {
          value: {
            formatter: (value, context) => {
              const measure = allMeasures[context.datasetIndex];
              if (!measure) return value;
              return themeFormatter.data(measure, value);
            },
          },
        },
      },
    },
  };

  const tooltipOptions: Partial<ChartOptions<'bar'>> = {
    plugins: {
      tooltip: {
        callbacks: {
          title: (context) => {
            const label = context[0]?.label;
            return themeFormatter.data(getDimensionWithoutTruncation(dimension), label);
          },
          label: (context) => {
            const measure = allMeasures[context.datasetIndex];
            if (!measure) return '';
            const raw = context.raw as number;
            return `${context.dataset.label}: ${themeFormatter.data(measure, raw)}`;
          },
        },
      },
    },
  };

  const interactionOptions: Partial<ChartOptions<'bar'>> = {
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  const secondaryAxisOptions: Partial<ChartOptions<'bar'>> = showSecondaryAxis
    ? {
        scales: {
          y1: {
            type: 'linear',
            position: 'right',
            min: yAxisSecondaryMin,
            max: yAxisSecondaryMax,
            title: {
              display: Boolean(yAxisSecondaryLabel),
              text: yAxisSecondaryLabel ?? '',
            },
            grid: { drawOnChartArea: false },
            ticks: {
              callback: (value) => {
                const firstLineMeasure = lineMeasures[0];
                if (!firstLineMeasure) return value;
                return themeFormatter.data(firstLineMeasure, value);
              },
            },
          },
        },
      }
    : {};

  return mergician(
    baseOptions,
    datalabelsOptions,
    tooltipOptions,
    interactionOptions,
    secondaryAxisOptions,
    theme.charts?.barLineChartPro?.options ?? {},
  );
};

export const createBarLineClickHandler = ({
  data,
  dimension,
  granularity,
  measures,
  onBarClicked,
  onLineClicked,
}: {
  data: ChartData;
  dimension: Dimension;
  granularity?: Granularity;
  measures: Measure[];
  onBarClicked?: (args: BarLineChartProClickArg) => void;
  onLineClicked?: (args: BarLineChartProClickArg) => void;
}): ((args: ChartClickArgs) => void) => {
  return ({ elementAtEvent }) => {
    const element = elementAtEvent[0];
    if (!element) return;

    const dimensionValue = data?.labels?.[element.index] as string | undefined;
    const dimensionTimeRange = getTimeRangeFromDimensionValue({
      value: dimensionValue,
      stateGranularity: granularity,
      dimension,
    });
    const clickArg: BarLineChartProClickArg = { dimensionValue, dimensionTimeRange };

    if (element.datasetIndex < measures.length) {
      onBarClicked?.(clickArg);
    } else {
      onLineClicked?.(clickArg);
    }
  };
};
