import { CUBE_DIMENSION_TYPE_TIME, DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { Theme } from '../../../theme/theme.types';
import { remarkableTheme } from '../../../theme/theme.constants';
import { ChartData, ChartOptions } from 'chart.js';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { getDatalabelPercentage, groupTailAsOther } from '../charts.utils';
import { getDimensionMeasureColor } from '../../../theme/styles/styles.utils';
import { getChartColors } from '@embeddable.com/remarkable-ui';
import { Context } from 'chartjs-plugin-datalabels';

export const getBarStackedChartProData = (
  props: {
    data: DataResponse['data'];
    dimension: Dimension;
    groupDimension: Dimension;
    measure: Measure;
    axisOrder?: string[];
  },
  theme: Theme,
): ChartData<'bar'> => {
  const themeFormatter = getThemeFormatter(theme);
  const { data = [], dimension, groupDimension, measure } = props;

  const uniqueAxis = [...new Set(data.map((d) => d[dimension.name]).filter((d) => d != null))];
  uniqueAxis.sort();

  const axis = props.axisOrder ? props.axisOrder.filter((v) => uniqueAxis.includes(v)) : uniqueAxis;
  const groupDimensionName = `${groupDimension.name}${groupDimension.nativeType === CUBE_DIMENSION_TYPE_TIME && groupDimension.inputs?.granularity ? `.${groupDimension.inputs.granularity}` : ''}`;
  const groupBy = [...new Set(data.map((d) => d[groupDimensionName]))].filter((d) => d != null);

  const chartColors = getChartColors();
  const datasets = groupBy.map((groupByItem, index) => {
    const backgroundColor = getDimensionMeasureColor({
      dimensionOrMeasure: groupDimension,
      theme,
      color: 'background',
      value: `${groupDimension.name}.${groupByItem}`,
      index,
      chartColors,
    });

    const borderColor = getDimensionMeasureColor({
      dimensionOrMeasure: groupDimension,
      theme,
      color: 'border',
      value: `${groupDimension.name}.${groupByItem}`,
      index,
      chartColors,
    });

    let label: string;
    if (theme.disableFormatting?.chart?.labels) {
      label = groupByItem;
    } else {
      label = themeFormatter.data(groupDimension, groupByItem);
    }

    return {
      label,
      rawLabel: groupByItem,
      backgroundColor,
      borderColor,
      data: axis.map((axisItem) => {
        const record = data.find(
          (d) => d[groupDimensionName] === groupByItem && d[dimension.name] === axisItem,
        );
        return record ? Number(record[measure.name]) : 0;
      }),
    };
  });

  return {
    labels: axis,
    datasets,
  };
};

export const getBarChartProData = (
  props: {
    data: DataResponse['data'];
    dimension: Dimension;
    measures: Measure[];
    maxItems?: number;
  },
  theme: Theme = remarkableTheme,
): ChartData<'bar'> => {
  if (!props.data) {
    return {
      labels: [],
      datasets: [{ data: [] }],
    };
  }

  const themeFormatter = getThemeFormatter(theme);
  const groupedData = groupTailAsOther(props.data, props.dimension, props.measures, props.maxItems);
  const chartColors = getChartColors();

  return {
    labels: groupedData.map((item) => {
      return item[props.dimension.name];
    }),
    datasets: props.measures.map((measure, index) => {
      const backgroundColor = getDimensionMeasureColor({
        dimensionOrMeasure: measure,
        theme,
        color: 'background',
        value: measure.name,
        index,
        chartColors,
      });

      const borderColor = getDimensionMeasureColor({
        dimensionOrMeasure: measure,
        theme,
        color: 'border',
        value: measure.name,
        index,
        chartColors,
      });

      return {
        label: themeFormatter.dimensionOrMeasureTitle(measure),
        data: groupedData.map((item) => item[measure.name] ?? 0),
        backgroundColor,
        borderColor,
      };
    }),
  };
};

const getBarChartProDatalabelTotalFormatter = (
  context: Context,
  formatter: (value: number) => string,
) => {
  const { datasets } = context.chart.data;
  const i = context.dataIndex;

  const total = datasets.reduce((sum, ds) => {
    const val = ds.data[i] as number;
    return sum + (val || 0);
  }, 0);

  return formatter(total);
};

export const getBarChartProOptions = (
  options: {
    onBarClicked?: (args: {
      axisDimensionValue: string | null;
      groupingDimensionValue: string | null;
    }) => void;
    measures: Measure[];
    dimension: Dimension;
    horizontal: boolean;
    data: ChartData<'bar'>;
  },
  theme: Theme,
): Partial<ChartOptions<'bar'>> => {
  const { onBarClicked, measures, dimension, horizontal, data } = options;

  const themeFormatter = getThemeFormatter(theme);
  return {
    plugins: {
      legend: { position: theme.charts.legendPosition ?? 'bottom' },
      datalabels: {
        labels: {
          total: {
            formatter: (_value: string | number, context: Context) => {
              return getBarChartProDatalabelTotalFormatter(context, (value: number) => {
                if (theme.disableFormatting?.chart?.datalabels) {
                  return value.toString();
                }
                return themeFormatter.data(measures[0]!, value);
              });
            },
          },
          value: {
            formatter: (value: string | number, context) => {
              const measure = measures[context.datasetIndex % measures.length]!;

              if (measure.inputs?.showValueAsPercentage) {
                return getDatalabelPercentage(Number(value), context.dataset.data);
              }
              if (theme.disableFormatting?.chart?.datalabels) {
                return value;
              }
              return themeFormatter.data(measure, value);
            },
          },
        },
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const label = context[0]?.label;
            if (theme.disableFormatting?.chart?.tooltip) {
              return label;
            }
            return themeFormatter.data(dimension, label);
          },

          label: (context) => {
            const measure = measures[context.datasetIndex % measures.length]!;
            const raw = context.raw as number;

            let dimensionLabel: string;
            if (theme.disableFormatting?.chart?.tooltip) {
              dimensionLabel = context.dataset.label ?? '';
            } else {
              dimensionLabel = themeFormatter.data(dimension, context.dataset.label) || '';
            }

            let measureValue: string | number;
            if (theme.disableFormatting?.chart?.labels) {
              measureValue = raw;
            } else {
              measureValue = themeFormatter.data(measure, raw);
            }

            let percentage = '';
            if (measure.inputs?.showValueAsPercentage) {
              percentage = `(${getDatalabelPercentage(raw, context.dataset.data)})`;
            }
            return `${dimensionLabel}: ${measureValue} ${percentage}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (value) => {
            if (horizontal) {
              if (theme.disableFormatting?.chart?.xAxis) {
                return value;
              }
              return themeFormatter.data(measures[0]!, value);
            }

            if (!data || !data.labels) return undefined;

            const label = data.labels[Number(value)] as string;
            if (theme.disableFormatting?.chart?.xAxis) {
              return label;
            }
            return themeFormatter.data(dimension, label);
          },
        },
      },
      y: {
        ticks: {
          callback: (value) => {
            if (!horizontal) {
              if (theme.disableFormatting?.chart?.yAxis) {
                return value;
              }
              return themeFormatter.data(measures[0]!, value);
            }
            if (!data || !data.labels) return undefined;
            const label = data.labels[Number(value)] as string;
            if (theme.disableFormatting?.chart?.yAxis) {
              return label;
            }
            return themeFormatter.data(dimension, label);
          },
        },
      },
    },
    onClick: (_event, elements, chart) => {
      if (!onBarClicked) return;

      const element = elements[0];
      const axisDimensionValue = (element ? chart.data.labels![element.index] : null) as
        | string
        | null;
      const groupingDimensionValue = (
        element
          ? (chart.data.datasets[element.datasetIndex] as { rawLabel?: string | null })?.rawLabel
          : null
      ) as string | null;

      onBarClicked({
        axisDimensionValue,
        groupingDimensionValue,
      });
    },
  };
};
