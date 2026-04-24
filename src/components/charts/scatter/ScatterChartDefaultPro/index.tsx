import { useTheme } from '@embeddable.com/react';
import { ScatterChart } from '@embeddable.com/remarkable-ui';
import type { ChartPointClicked, ScatterDatasetWithOriginal } from '@embeddable.com/remarkable-ui';
import { mergician } from 'mergician';
import { useMemo } from 'react';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import type { ChartOptions } from 'chart.js';
import { Theme } from '../../../../theme/theme.types';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { i18nSetup, i18n } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { getPointClickData, getScatterChartProData } from './ScatterChartDefaultPro.utils';

import type { PointClickArgs } from '../../charts.types';
export type ScatterChartPointClickArgs = PointClickArgs;

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
              return `(${formatValue(xMeasure, raw.x)}, ${formatValue(yMeasure, raw.y)})`;
            },
          },
        },
      },
    },
  };
};

export type ScatterChartDefaultProProps = {
  xMeasure: Measure;
  yMeasure: Measure;
  pointDimension: Dimension;
  groupByDimension?: Dimension;
  results: DataResponse;
  pointColor?: string;
  showLegend?: boolean;
  showTooltips?: boolean;
  showPointLabels?: boolean;
  showValueLabels?: boolean;
  showLogarithmicScale?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  xAxisRangeMin?: number;
  xAxisRangeMax?: number;
  yAxisRangeMin?: number;
  yAxisRangeMax?: number;
  reverseXAxis?: boolean;
  onPointClick?: (payload: ScatterChartPointClickArgs) => void;
} & ChartCardHeaderProps;

const ScatterChartDefaultPro = (props: ScatterChartDefaultProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    xMeasure,
    yMeasure,
    pointDimension,
    groupByDimension,
    results,
    pointColor,
    showLegend,
    showTooltips,
    showPointLabels,
    showValueLabels,
    showLogarithmicScale,
    xAxisRangeMin,
    xAxisRangeMax,
    yAxisRangeMin,
    yAxisRangeMax,
    reverseXAxis,
    onPointClick,
    hideMenu,
  } = props;

  const { title, description, tooltip, xAxisLabel, yAxisLabel } = resolveI18nProps(props);

  const noValueLabel = i18n.t('charts.scatterChart.noValue');

  const { chartData, rowIndexByPoint } = useMemo(
    () =>
      getScatterChartProData(
        {
          data: results.data,
          xMeasure,
          yMeasure,
          pointDimension,
          groupByDimension,
          noValueLabel,
          pointColor,
        },
        theme,
      ),
    [
      results.data,
      xMeasure,
      yMeasure,
      pointDimension,
      groupByDimension,
      noValueLabel,
      pointColor,
      theme,
    ],
  );

  const handlePointClick = (point: ChartPointClicked | undefined) => {
    if (!onPointClick || !point) return;
    const clickData = getPointClickData(
      point,
      rowIndexByPoint,
      results.data,
      xMeasure,
      yMeasure,
      pointDimension,
      groupByDimension,
    );
    if (clickData) onPointClick(clickData);
  };

  const chartOptions = mergician(
    getScatterChartProOptions({ xMeasure, yMeasure }, theme, noValueLabel),
    theme.charts.scatterChartDefaultPro?.options ?? {},
  );

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[
        pointDimension,
        xMeasure,
        yMeasure,
        ...(groupByDimension ? [groupByDimension] : []),
      ]}
      errorMessage={results.error}
      description={description}
      title={title}
      tooltip={tooltip}
      hideMenu={hideMenu}
    >
      <ScatterChart
        data={chartData}
        options={chartOptions}
        nullBandLabel={noValueLabel}
        showLegend={showLegend}
        showTooltips={showTooltips}
        showPointLabels={showPointLabels}
        showValueLabels={showValueLabels}
        showLogarithmicScale={showLogarithmicScale}
        xAxisLabel={xAxisLabel}
        yAxisLabel={yAxisLabel}
        xAxisRangeMin={xAxisRangeMin}
        xAxisRangeMax={xAxisRangeMax}
        yAxisRangeMin={yAxisRangeMin}
        yAxisRangeMax={yAxisRangeMax}
        reverseXAxis={reverseXAxis}
        onPointClick={handlePointClick}
      />
    </ChartCard>
  );
};

export default ScatterChartDefaultPro;
