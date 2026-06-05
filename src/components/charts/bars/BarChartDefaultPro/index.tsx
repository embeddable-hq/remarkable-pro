import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, pickChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import { BarChart } from '@embeddable.com/remarkable-ui';
import { getBarChartProData, getBarChartProOptions } from '../bars.utils';
import { mergician } from 'mergician';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';
import { BarChartBaseProps } from '../bars.types';
import { createSimpleClickHandler } from '../../charts.utils';

export type BarChartDefaultProProps = BarChartBaseProps & {
  reverseXAxis?: boolean;
  xAxisMaxItems?: number;
  yAxisRangeMin?: number;
  yAxisRangeMax?: number;
};

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
    dimension,
    granularity,
    setGranularity,
    onBarClicked,
  } = props;

  const resolvedProps = resolveI18nProps(props);
  const { xAxisLabel, yAxisLabel } = resolvedProps;
  const { tooltip, description, title } = resolvedProps;

  const results = useFillGaps({
    results: props.results,
    dimension,
  });

  const data = getBarChartProData(
    { data: results.data, dimension, measures, maxItems: xAxisMaxItems },
    theme,
  );

  const options = mergician(
    getBarChartProOptions({ measures, horizontal: false, data, dimension }, theme), // Format Y axis based on first measure
    theme.charts?.barChartDefaultPro?.options ?? {},
  );

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

  const handleClick = createSimpleClickHandler({
    data,
    dimension,
    granularity,
    onClicked: onBarClicked,
  });

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[dimension, ...measures]}
      errorMessage={results.error}
      {...pickChartCardHeaderProps(resolvedProps)}
    >
      {setGranularity && (
        <ChartGranularitySelectField
          hasMarginTop={granularitySelectorHasMarginTop}
          dimension={dimension}
          onChange={setGranularity}
        />
      )}
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
        onClick={handleClick}
      />
    </ChartCard>
  );
};

export default BarChartDefaultPro;
