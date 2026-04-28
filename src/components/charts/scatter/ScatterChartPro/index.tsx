import { useTheme } from '@embeddable.com/react';
import { ScatterChart, ChartClickArgs } from '@embeddable.com/remarkable-ui';
import { mergician } from 'mergician';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup, i18n } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import {
  getPointClickData,
  getScatterChartProData,
  getScatterChartProOptions,
} from './ScatterChartPro.utils';

import type { ScatterChartProOptionsClickArg } from '../scatter.types';

export type ScatterChartProProps = {
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
  onPointClick?: (payload: ScatterChartProOptionsClickArg) => void;
} & ChartCardHeaderProps;

const ScatterChartPro = (props: ScatterChartProProps) => {
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

  const chartData = getScatterChartProData(
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
  );

  const handleClick = ({ elementAtEvent }: ChartClickArgs) => {
    const element = elementAtEvent[0];
    if (!element) return;
    const clickData = getPointClickData(
      element,
      chartData.datasets,
      results.data,
      xMeasure,
      yMeasure,
      pointDimension,
      groupByDimension,
    );
    if (clickData) onPointClick?.(clickData);
  };

  const chartOptions = mergician(
    getScatterChartProOptions({ xMeasure, yMeasure, noValueLabel }, theme),
    theme.charts.scatterChartPro?.options ?? {},
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
        onClick={handleClick}
      />
    </ChartCard>
  );
};

export default ScatterChartPro;
