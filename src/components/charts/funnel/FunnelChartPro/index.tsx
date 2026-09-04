import { useTheme } from '@embeddable.com/react';
import { FunnelChart } from '@embeddable.com/remarkable-ui';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { mergician } from 'mergician';
import { Theme } from '../../../../theme/theme.types';
import { getFunnelChartProData, getFunnelChartProOptions } from '../funnel.utils';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import {
  ChartCard,
  ChartCardHeaderProps,
  asChartCardHeaderProps,
} from '../../shared/ChartCard/ChartCard';

export type FunnelChartProProps = {
  stageDimension: Dimension;
  countMeasure: Measure;
  orderDimension?: Dimension;
  startColor?: string;
  endColor?: string;
  results: DataResponse;
  showLegend?: boolean;
  showTooltips?: boolean;
  displayPercentages?: boolean;
} & ChartCardHeaderProps;

const FunnelChartPro = (props: FunnelChartProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    stageDimension,
    countMeasure,
    orderDimension,
    startColor,
    endColor,
    results,
    showLegend,
    showTooltips,
    displayPercentages,
  } = props;

  const data = getFunnelChartProData(
    {
      data: results.data,
      stageDimension,
      countMeasure,
      orderDimension,
      startColor,
      endColor,
    },
    theme,
  );

  const options = mergician(
    getFunnelChartProOptions(theme),
    theme.charts.funnelChartPro?.options ?? {},
  );

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[
        stageDimension,
        countMeasure,
        ...(orderDimension ? [orderDimension] : []),
      ]}
      errorMessage={results.error}
      {...asChartCardHeaderProps(props)}
    >
      <FunnelChart
        data={data}
        options={options}
        showLegend={showLegend}
        showTooltips={showTooltips}
        showPercentage={displayPercentages}
      />
    </ChartCard>
  );
};

export default FunnelChartPro;
