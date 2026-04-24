import { useTheme } from '@embeddable.com/react';
import { ScatterChart } from '@embeddable.com/remarkable-ui';
import type { ChartPointClicked } from '@embeddable.com/remarkable-ui';
import { mergician } from 'mergician';
import { useMemo } from 'react';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup, i18n } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import {
  getPointClickData,
  getScatterChartProData,
  getScatterChartProOptions,
} from './ScatterChartDefaultPro.utils';

import type { PointClickArgs } from '../../charts.types';
export type ScatterChartPointClickArgs = PointClickArgs;

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

  const chartData = useMemo(
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
      chartData.datasets,
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
