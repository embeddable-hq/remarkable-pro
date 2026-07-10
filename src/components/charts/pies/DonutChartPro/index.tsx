import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { getPieChartProOptions, getPieChartProData, createPieClickHandler } from '../pies.utils';
import { DefaultPieChartProps } from '../pies.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, asChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { DonutChart } from '@embeddable.com/remarkable-ui';
import { mergician } from 'mergician';
import { getMeasureTotals, isOtherTotalPending } from '../../charts.other.loadData.utils';
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

  const otherOptions = {
    measureTotals: getMeasureTotals(resultsOtherTotal, [measure]),
  };

  const cardData = isOtherTotalPending(resultsOtherTotal)
    ? { ...results, isLoading: true, data: undefined }
    : results;

  const data = getPieChartProData(
    { data: results.data, dimension, measure, maxLegendItems, otherOptions },
    theme,
  );

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
