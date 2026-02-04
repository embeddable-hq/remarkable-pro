import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import { BarChart } from '@embeddable.com/remarkable-ui';
import { getBarChartProOptions, getBarStackedChartProData } from '../bars.utils';
import { mergician } from 'mergician';
import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';

type BarChartGroupedProProps = {
  groupBy: Dimension;
  measure: Measure;
  results: DataResponse;
  reverseXAxis?: boolean;
  showLegend?: boolean;
  showLogarithmicScale?: boolean;
  showTooltips?: boolean;
  showTotalLabels?: boolean;
  showValueLabels?: boolean;
  xAxis: Dimension;
  xAxisLabel?: string;
  yAxisLabel?: string;
  yAxisRangeMax?: number;
  yAxisRangeMin?: number;
  setGranularity: (granularity: Granularity) => void;
  onBarClicked?: (args: {
    axisDimensionValue: string | null;
    groupingDimensionValue: string | null;
  }) => void;
} & ChartCardHeaderProps;

const BarChartGroupedPro = (props: BarChartGroupedProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    groupBy,
    measure,
    reverseXAxis,
    showLegend,
    showLogarithmicScale,
    showTooltips,
    showTotalLabels,
    showValueLabels,
    xAxis,
    yAxisRangeMax,
    yAxisRangeMin,
    setGranularity,
    onBarClicked,
  } = props;

  const { tooltip, description, title, xAxisLabel, yAxisLabel } = resolveI18nProps(props);

  const { hideMenu } = props;

  const results = useFillGaps({
    results: props.results,
    dimension: props.xAxis,
  });

  const data = getBarStackedChartProData(
    {
      data: results.data,
      dimension: xAxis,
      groupDimension: groupBy,
      measure,
    },
    theme,
  );

  const options = mergician(
    getBarChartProOptions(
      { measures: [measure], horizontal: false, onBarClicked, data, dimension: xAxis },
      theme,
    ),
    theme.charts?.barChartGroupedPro?.options || {},
  );

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[measure, xAxis, groupBy]}
      errorMessage={results.error}
      description={description}
      title={title}
      tooltip={tooltip}
      hideMenu={hideMenu}
    >
      <ChartGranularitySelectField
        hasMarginTop={!title && !description && !tooltip}
        dimension={xAxis}
        onChange={setGranularity}
      />
      <BarChart
        data={data}
        showLegend={showLegend}
        showTooltips={showTooltips}
        showValueLabels={showValueLabels}
        showLogarithmicScale={showLogarithmicScale}
        xAxisLabel={xAxisLabel}
        yAxisLabel={yAxisLabel}
        reverseXAxis={reverseXAxis}
        yAxisRangeMin={yAxisRangeMin}
        yAxisRangeMax={yAxisRangeMax}
        showTotalLabels={showTotalLabels}
        options={options}
      />
    </ChartCard>
  );
};

export default BarChartGroupedPro;
