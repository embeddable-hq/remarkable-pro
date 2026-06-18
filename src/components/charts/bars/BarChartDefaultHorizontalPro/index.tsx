import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, asChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import { BarChart } from '@embeddable.com/remarkable-ui';
import { getBarChartProData, getBarChartProOptions } from '../bars.utils';
import { mergician } from 'mergician';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';
import { BarChartBaseProps } from '../bars.types';
import { createSimpleClickHandler } from '../../charts.utils';

export type BarChartDefaultHorizontalProProps = BarChartBaseProps & {
  reverseYAxis?: boolean;
  xAxisRangeMax?: number;
  xAxisRangeMin?: number;
  yAxisMaxItems?: number;
};

const BarChartDefaultHorizontalPro = (props: BarChartDefaultHorizontalProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
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
    granularity,
    setGranularity,
    onBarClicked,
  } = props;

  const resolvedI18nProps = resolveI18nProps(props);
  const { description, title, tooltip, xAxisLabel, yAxisLabel } = resolvedI18nProps;

  const results = useFillGaps({
    results: props.results,
    dimension,
  });

  const data = getBarChartProData(
    { data: results.data, dimension, measures, maxItems: yAxisMaxItems },
    theme,
  );

  const options = mergician(
    getBarChartProOptions({ measures, horizontal: true, data, dimension }, theme), // Format X axis based on first measure
    theme.charts?.barChartDefaultHorizontalPro?.options ?? {},
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
      {...asChartCardHeaderProps(resolvedI18nProps, props)}
    >
      {setGranularity && (
        <ChartGranularitySelectField
          hasMarginTop={granularitySelectorHasMarginTop}
          dimension={dimension}
          onChange={setGranularity}
        />
      )}
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
        onClick={handleClick}
      />
    </ChartCard>
  );
};

export default BarChartDefaultHorizontalPro;
