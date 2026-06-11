import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { getPieChartProOptions, getPieChartProData, createPieClickHandler } from '../pies.utils';
import { DefaultPieChartProps } from '../pies.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, asChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { DonutChart } from '@embeddable.com/remarkable-ui';
import { mergician } from 'mergician';
import { resolveI18nProps } from '../../../component.utils';

export type DonutChartProProps = DefaultPieChartProps;

const DonutChartPro = (props: DonutChartProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const resolvedI18nProps = resolveI18nProps(props);

  const {
    dimension,
    maxLegendItems,
    measure,
    results,
    showLegend,
    showTooltips,
    showValueLabels,
    onSegmentClick,
  } = props;

  const data = getPieChartProData(
    { data: results.data, dimension, measure, maxLegendItems },
    theme,
  );

  const options = mergician(
    getPieChartProOptions({ measure, dimension }, theme),
    theme.charts.donutChartPro?.options ?? {},
  );

  const handleClick = createPieClickHandler({ results, dimension, onClicked: onSegmentClick });

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[dimension, measure]}
      errorMessage={results.error}
      {...asChartCardHeaderProps(resolvedI18nProps)}
    >
      <DonutChart
        data={data}
        options={options}
        showLegend={showLegend}
        showTooltips={showTooltips}
        showValueLabels={showValueLabels}
        onClick={handleClick}
      />
    </ChartCard>
  );
};

export default DonutChartPro;
