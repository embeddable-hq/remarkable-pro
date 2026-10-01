import { useTheme } from '@embeddable.com/react';
import { FunnelChart } from '@embeddable.com/remarkable-ui';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { mergician } from 'mergician';
import { Theme } from '../../../../theme/theme.types';
import { getFunnelChartProData, getFunnelChartProOptions } from './FunnelChartPro.utils';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { PositionValue } from '../../../types/Position.type.emb';
import {
  ChartCard,
  ChartCardHeaderProps,
  asChartCardHeaderProps,
} from '../../shared/ChartCard/ChartCard';

export type FunnelChartProProps = {
  sectionDimension: Dimension;
  countMeasure: Measure;
  orderDimension?: Dimension;
  startColor?: string;
  endColor?: string;
  results: DataResponse;
  showLegend?: boolean;
  showTooltips?: boolean;
  showValueLabels?: boolean;
  showSectionLabels?: boolean;
  displayPercentages?: boolean;
  shrinkAnchor?: PositionValue;
  shrinkFraction?: number;
} & ChartCardHeaderProps;

const FunnelChartPro = (props: FunnelChartProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    sectionDimension,
    countMeasure,
    orderDimension,
    startColor,
    endColor,
    results,
    showLegend,
    showTooltips,
    showValueLabels,
    displayPercentages,
    shrinkAnchor,
    shrinkFraction,
  } = props;

  const data = getFunnelChartProData(
    {
      data: results.data,
      sectionDimension,
      countMeasure,
      orderDimension,
      startColor,
      endColor,
    },
    theme,
  );

  const options = mergician(
    getFunnelChartProOptions(props, theme),
    theme.charts.funnelChartPro?.options ?? {},
  );

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[
        sectionDimension,
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
        showValueLabels={showValueLabels}
        showPercentage={displayPercentages}
        shrinkAnchor={shrinkAnchor}
        shrinkFraction={shrinkFraction}
      />
    </ChartCard>
  );
};

export default FunnelChartPro;
