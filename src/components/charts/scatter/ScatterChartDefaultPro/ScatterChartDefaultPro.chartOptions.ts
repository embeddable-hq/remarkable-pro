import type { Measure } from '@embeddable.com/core';
import type { ScatterDatasetWithOriginal } from '@embeddable.com/remarkable-ui';
import type { ChartOptions } from 'chart.js';
import type { Theme } from '../../../../theme/theme.types';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';

export const getScatterChartProOptions = (
  { xMeasure, yMeasure }: { xMeasure: Measure; yMeasure: Measure },
  theme: Theme,
  noValueLabel: string,
): Partial<ChartOptions<'scatter'>> => {
  const themeFormatter = getThemeFormatter(theme);

  const formatValue = (measure: Measure, value: number | null | undefined): string => {
    if (value === null || value === undefined) return noValueLabel;
    return themeFormatter.data(measure, value);
  };

  return {
    scales: {
      x: {
        ticks: {
          callback: (tickValue) => {
            const v = typeof tickValue === 'number' ? tickValue : Number(tickValue);
            return themeFormatter.data(xMeasure, v);
          },
        },
      },
      y: {
        ticks: {
          callback: (tickValue) => {
            const v = typeof tickValue === 'number' ? tickValue : Number(tickValue);
            return themeFormatter.data(yMeasure, v);
          },
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const ds = ctx.dataset as ScatterDatasetWithOriginal;
            const orig =
              ds.originalData?.[ctx.dataIndex] ??
              (ctx.dataset.data[ctx.dataIndex] as
                | { x: number | null; y: number | null }
                | undefined);
            const prefix = ds.label ? `${ds.label}: ` : '';
            if (!orig) return prefix;
            return `${prefix}(${formatValue(xMeasure, orig.x)}, ${formatValue(yMeasure, orig.y)})`;
          },
        },
      },
      datalabels: {
        labels: {
          value: {
            formatter: (_value, context) => {
              const ds = context.dataset as ScatterDatasetWithOriginal;
              const raw =
                ds.originalData?.[context.dataIndex] ??
                (context.dataset.data[context.dataIndex] as
                  | { x: number | null; y: number | null }
                  | undefined);
              if (!raw) return '';
              return `${formatValue(xMeasure, raw.x)}, ${formatValue(yMeasure, raw.y)}`;
            },
          },
        },
      },
    },
  };
};
