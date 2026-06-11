import { useTheme } from '@embeddable.com/react';
import { BubbleChart } from '@embeddable.com/remarkable-ui';
import { mergician } from 'mergician';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup, i18n } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import {
  ChartCard,
  ChartCardHeaderProps,
  asChartCardHeaderProps,
} from '../../shared/ChartCard/ChartCard';
import {
  createBubbleClickHandler,
  getBubbleChartProData,
  getBubbleChartProOptions,
} from './BubbleChartPro.utils';

import type { BubbleChartProOptionsClickArg } from './BubbleChartPro.types';

export type BubbleChartProProps = {
  xMeasure: Measure;
  yMeasure: Measure;
  bubbleSizeMeasure: Measure;
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
  bubbleRadiusMin?: number;
  bubbleRadiusMax?: number;
  onPointClick?: (payload: BubbleChartProOptionsClickArg) => void;
} & ChartCardHeaderProps;

const BubbleChartPro = (props: BubbleChartProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    xMeasure,
    yMeasure,
    bubbleSizeMeasure: sizeMeasure,
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
    bubbleRadiusMin,
    bubbleRadiusMax,
    onPointClick,
  } = props;

  const resolvedI18nProps = resolveI18nProps(props);
  const { xAxisLabel, yAxisLabel } = resolvedI18nProps;

  const noValueLabel = i18n.t('charts.scatterChart.noValue');

  const chartData = getBubbleChartProData(
    {
      data: results.data,
      xMeasure,
      yMeasure,
      sizeMeasure,
      pointDimension,
      groupByDimension,
      noValueLabel,
      pointColor,
    },
    theme,
  );

  const handleClick = createBubbleClickHandler({
    datasets: chartData.datasets,
    results,
    xMeasure,
    yMeasure,
    sizeMeasure,
    pointDimension,
    groupByDimension,
    onPointClick,
  });

  const chartOptions = mergician(
    getBubbleChartProOptions(
      {
        xMeasure,
        yMeasure,
        sizeMeasure,
        noValueLabel,
        bubbleRadiusMax,
        showPointLabels,
      },
      theme,
    ),
    theme.charts.bubbleChartPro?.options ?? {},
  );

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[
        pointDimension,
        xMeasure,
        yMeasure,
        sizeMeasure,
        ...(groupByDimension ? [groupByDimension] : []),
      ]}
      errorMessage={results.error}
      {...asChartCardHeaderProps(resolvedI18nProps)}
    >
      <BubbleChart
        data={chartData}
        options={chartOptions}
        nullBandLabel={noValueLabel}
        showLegend={showLegend && !!groupByDimension}
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
        bubbleRadiusMin={bubbleRadiusMin}
        bubbleRadiusMax={bubbleRadiusMax}
        onClick={handleClick}
      />
    </ChartCard>
  );
};

export default BubbleChartPro;
