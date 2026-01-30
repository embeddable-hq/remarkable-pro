import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import { BarChart } from '@embeddable.com/remarkable-ui';
import { getBarChartProData, getBarChartProOptions } from '../bars.utils';
import { mergician } from 'mergician';
import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';

type BarChartDefaultHorizontalProProps = {
  dimension: Dimension;
  measures: Measure[];
  results: DataResponse;
  reverseYAxis?: boolean;
  showLegend?: boolean;
  showLogarithmicScale?: boolean;
  showTooltips?: boolean;
  showValueLabels?: boolean;
  xAxisLabel?: string;
  xAxisRangeMax?: number;
  xAxisRangeMin?: number;
  yAxisLabel?: string;
  yAxisMaxItems?: number;
  setGranularity: (granularity: Granularity) => void;
  onBarClicked?: (args: { axisDimensionValue: string | null }) => void;
} & ChartCardHeaderProps;

const BarChartDefaultHorizontalPro = (props: BarChartDefaultHorizontalProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    hideMenu,
    dimension,
    measures,
    showValueLabels,
    reverseYAxis,
    showLegend,
    showLogarithmicScale,
    showTooltips,
    xAxisRangeMax,
    xAxisRangeMin,
    yAxisMaxItems,

    setGranularity,
    onBarClicked,
  } = props;

  const { description, title, xAxisLabel, yAxisLabel } = resolveI18nProps(props);

  const results = useFillGaps({
    results: props.results,
    dimension,
  });

  const data = getBarChartProData(
    { data: results.data, dimension, measures, maxItems: yAxisMaxItems },
    theme,
  );

  const options = mergician(
    getBarChartProOptions({ measures, horizontal: true, onBarClicked, data, dimension }, theme), // Format X axis based on first measure
    theme.charts?.barChartDefaultHorizontalPro?.options || {},
  );

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[dimension, ...measures]}
      errorMessage={results.error}
      description={description}
      title={title}
      hideMenu={hideMenu}
    >
      <ChartGranularitySelectField
        hasMarginTop={!title && !description}
        dimension={dimension}
        onChange={setGranularity}
      />
      <BarChart
        horizontal
        data={data}
        options={options}
        reverseYAxis={reverseYAxis}
        showLegend={showLegend}
        showLogarithmicScale={showLogarithmicScale}
        showTooltips={showTooltips}
        showValueLabels={showValueLabels}
        xAxisLabel={xAxisLabel}
        xAxisRangeMax={xAxisRangeMax}
        xAxisRangeMin={xAxisRangeMin}
        yAxisLabel={yAxisLabel}
      />
    </ChartCard>
  );
};

export default BarChartDefaultHorizontalPro;
