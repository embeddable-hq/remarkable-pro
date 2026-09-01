import { useTheme } from '@embeddable.com/react';
import { FunnelChart } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../../theme/theme.types';
import { getFunnelChartProData } from '../funnel.utils';
import { DefaultFunnelChartProps } from '../funnel.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, asChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';

export type FunnelChartProProps = DefaultFunnelChartProps;

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

  const options = {
    ...theme.charts.funnelChartPro?.options,
    plugins: {
      ...theme.charts.funnelChartPro?.options?.plugins,
      legend: {
        ...theme.charts.funnelChartPro?.options?.plugins?.legend,
        position: theme.charts.legendPosition ?? 'bottom',
      },
    },
  };

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
