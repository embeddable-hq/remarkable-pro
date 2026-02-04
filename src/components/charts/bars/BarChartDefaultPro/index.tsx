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

type BarChartDefaultProProps = {
  dimension: Dimension;
  measures: Measure[];
  results: DataResponse;
  xAxisLabel?: string;
  xAxisMaxItems?: number;
  yAxisLabel?: string;
  yAxisRangeMin?: number;
  yAxisRangeMax?: number;
  showLegend?: boolean;
  showLogarithmicScale?: boolean;
  showTooltips?: boolean;
  showValueLabels?: boolean;
  reverseXAxis?: boolean;
  setGranularity: (granularity: Granularity) => void;
  onBarClicked?: (args: { axisDimensionValue: string | null }) => void;
} & ChartCardHeaderProps;

const BarChartDefaultPro = (props: BarChartDefaultProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    measures,
    yAxisRangeMin,
    xAxisMaxItems,
    yAxisRangeMax,
    showLegend,
    showTooltips,
    showLogarithmicScale,
    showValueLabels,
    reverseXAxis,
    hideMenu,
    dimension,
    setGranularity,
    onBarClicked,
  } = props;

  const { tooltip, description, title, xAxisLabel, yAxisLabel } = resolveI18nProps(props);

  const results = useFillGaps({
    results: props.results,
    dimension,
  });

  const data = getBarChartProData(
    { data: results.data, dimension, measures, maxItems: xAxisMaxItems },
    theme,
  );

  const options = mergician(
    getBarChartProOptions({ measures, horizontal: false, onBarClicked, data, dimension }, theme), // Format Y axis based on first measure
    theme.charts?.barChartDefaultPro?.options || {},
  );

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[dimension, ...measures]}
      errorMessage={results.error}
      description={description}
      title={title}
      tooltip={tooltip}
      hideMenu={hideMenu}
    >
      <ChartGranularitySelectField
        hasMarginTop={!title && !description && !tooltip}
        dimension={dimension}
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
        options={options}
      />
    </ChartCard>
  );
};

export default BarChartDefaultPro;
