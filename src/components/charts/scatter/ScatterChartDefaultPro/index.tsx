import { useTheme } from '@embeddable.com/react';
import { ScatterChart } from '@embeddable.com/remarkable-ui';
import type { ScatterPointClickHit } from '@embeddable.com/remarkable-ui';
import { ChartOptions } from 'chart.js';
import { mergician } from 'mergician';
import { useMemo } from 'react';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup, i18n } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { getScatterChartProMeasureFormattingProps } from './ScatterChartDefaultPro.chartOptions';
import { getDimensionFieldName, getScatterChartProData } from './ScatterChartDefaultPro.utils';

export type ScatterChartPointClickPayload = {
  xMeasureValue: string;
  yMeasureValue: string;
  pointDimensionValue: string;
  groupByDimensionValue: string | null;
};

export type ScatterChartDefaultProProps = {
  xMeasure: Measure;
  yMeasure: Measure;
  pointDimension: Dimension;
  groupByDimension?: Dimension | null;
  results: DataResponse;
  pointColor?: string | null;
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
  onPointClick?: (payload: ScatterChartPointClickPayload) => void;
} & ChartCardHeaderProps;

const serializeCellValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

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
    xAxisLabel,
    yAxisLabel,
    xAxisRangeMin,
    xAxisRangeMax,
    yAxisRangeMin,
    yAxisRangeMax,
    reverseXAxis,
    onPointClick,
    hideMenu,
  } = props;

  const { title, description, tooltip } = resolveI18nProps(props);

  const noValueLabel = i18n.t('charts.scatterChart.noValue');

  const { chartData, rowIndexByPoint } = useMemo(
    () =>
      getScatterChartProData(
        {
          data: results.data,
          xMeasure,
          yMeasure,
          pointDimension,
          groupByDimension: groupByDimension ?? undefined,
          noValueLabel,
          pointColor: pointColor ?? undefined,
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

  const pointField = getDimensionFieldName(pointDimension);
  const groupField = groupByDimension ? getDimensionFieldName(groupByDimension) : undefined;

  const handlePointClick = (hit: ScatterPointClickHit | undefined) => {
    if (!onPointClick || !hit) return;
    const rowIdx = rowIndexByPoint[hit.datasetIndex]?.[hit.index];
    if (rowIdx === undefined) return;
    const row = results.data?.[rowIdx] as Record<string, unknown> | undefined;
    if (!row) return;

    onPointClick({
      xMeasureValue: serializeCellValue(row[xMeasure.name]),
      yMeasureValue: serializeCellValue(row[yMeasure.name]),
      pointDimensionValue: serializeCellValue(row[pointField]),
      groupByDimensionValue: groupField ? serializeCellValue(row[groupField]) : null,
    });
  };

  const measureFormatting = useMemo(
    () => getScatterChartProMeasureFormattingProps({ xMeasure, yMeasure }, theme),
    [xMeasure, yMeasure, theme],
  );

  const mergedOptions = useMemo(
    () =>
      mergician(
        {} as Partial<ChartOptions<'scatter'>>,
        theme.charts.scatterChartDefaultPro?.options ?? {},
      ),
    [theme],
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
        options={mergedOptions}
        nullBandLabel={noValueLabel}
        formatAxisTick={measureFormatting.formatAxisTick}
        formatMeasureValue={measureFormatting.formatMeasureValue}
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
