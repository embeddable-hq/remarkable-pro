import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { getPieChartProOptions, getPieChartProData, createPieClickHandler } from '../pies.utils';
import { DefaultPieChartProps } from '../pies.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, asChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { DonutChart } from '@embeddable.com/remarkable-ui';
import { mergician } from 'mergician';
import { getChartCardData } from '../../charts.other.loadData.utils';
export type DonutChartProProps = DefaultPieChartProps;

const DonutChartPro = (props: DonutChartProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    dimension,
    maxLegendItems,
    measure,
    results,
    resultsOtherTotal,
    showLegend,
    showTooltips,
    showValueLabels,
    onSegmentClick,
  } = props;

  const cardData = getChartCardData({
    results,
    resultsOtherTotal,
    dimension,
    measures: [measure],
    maxItems: maxLegendItems,
  });

  const data = getPieChartProData({ data: cardData.data, dimension, measure }, theme);

  const options = mergician(
    getPieChartProOptions({ measure, dimension }, theme),
    theme.charts.donutChartPro?.options ?? {},
  );

  const handleClick = createPieClickHandler({ results, dimension, onClicked: onSegmentClick });

  return (
    <ChartCard
      data={cardData}
      dimensionsAndMeasures={[dimension, measure]}
      errorMessage={results.error}
      {...asChartCardHeaderProps(props)}
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
