import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import { BarChart } from '@embeddable.com/remarkable-ui';
import { getBarChartProOptions, getBarStackedChartProData } from '../bars.utils';
import { mergician } from 'mergician';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { useFillGaps } from '../../charts.fillGaps.hooks';

type BarChartGroupedHorizontalProProps = {
  groupBy: Dimension;
  measure: Measure;
  results: DataResponse;
  reverseYAxis?: boolean;
  showLegend?: boolean;
  showLogarithmicScale?: boolean;
  showTooltips?: boolean;
  showTotalLabels?: boolean;
  showValueLabels?: boolean;

  yAxis: Dimension;
  xAxisLabel?: string;
  yAxisLabel?: string;
  xAxisRangeMax?: number;
  xAxisRangeMin?: number;
  onBarClicked?: (args: {
    axisDimensionValue: string | null;
    groupingDimensionValue: string | null;
  }) => void;
} & ChartCardHeaderProps;

const BarChartGroupedHorizontalPro = (props: BarChartGroupedHorizontalProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    description,
    groupBy,
    measure,
    reverseYAxis,
    showLegend,
    showLogarithmicScale,
    showTooltips,
    showTotalLabels,
    showValueLabels,
    title,
    yAxis,
    xAxisLabel,
    yAxisLabel,
    xAxisRangeMax,
    xAxisRangeMin,
    onBarClicked,
  } = resolveI18nProps(props);

  const { hideMenu } = props;

  const results = useFillGaps({
    results: props.results,
    dimension: props.yAxis,
  });

  const data = getBarStackedChartProData(
    {
      data: results.data,
      dimension: yAxis,
      groupDimension: groupBy,
      measure,
    },
    theme,
  );

  const options = mergician(
    getBarChartProOptions(
      { measures: [measure], horizontal: true, onBarClicked, data, dimension: yAxis },
      theme,
    ),
    theme.charts?.barChartGroupedHorizontalPro?.options || {},
  );

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[measure, yAxis, groupBy]}
      errorMessage={results.error}
      description={description}
      title={title}
      hideMenu={hideMenu}
    >
      <BarChart
        data={data}
        showLegend={showLegend}
        showTooltips={showTooltips}
        showValueLabels={showValueLabels}
        showLogarithmicScale={showLogarithmicScale}
        xAxisLabel={xAxisLabel}
        yAxisLabel={yAxisLabel}
        reverseYAxis={reverseYAxis}
        xAxisRangeMin={xAxisRangeMin}
        xAxisRangeMax={xAxisRangeMax}
        showTotalLabels={showTotalLabels}
        options={options}
        horizontal
      />
    </ChartCard>
  );
};

export default BarChartGroupedHorizontalPro;
