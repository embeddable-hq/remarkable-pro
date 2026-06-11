import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, asChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import { BarChart } from '@embeddable.com/remarkable-ui';
import { getBarStackedChartProData, getBarStackedChartProOptions } from '../bars.utils';
import { mergician } from 'mergician';
import { Dimension } from '@embeddable.com/core';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';
import { useUpdateAxisOrderAndCacheKey } from '../bars.hooks';
import { BarChartStackedBaseProps } from '../bars.types';
import { createGroupedClickHandler } from '../../charts.utils';

export type BarChartGroupedHorizontalProProps = BarChartStackedBaseProps & {
  yAxis: Dimension;
  reverseYAxis?: boolean;
  xAxisRangeMax?: number;
  xAxisRangeMin?: number;
};

const BarChartGroupedHorizontalPro = (props: BarChartGroupedHorizontalProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const resolvedI18nProps = resolveI18nProps(props);
  const { tooltip, description, title, xAxisLabel, yAxisLabel } = resolvedI18nProps;

  const {
    yAxis,
    groupBy,
    measure,
    reverseYAxis,
    showLegend,
    showLogarithmicScale,
    showTooltips,
    showTotalLabels,
    showValueLabels,
    xAxisRangeMax,
    xAxisRangeMin,
    granularity,
    setGranularity,
    onBarClicked,
    axisOrder,
    resultsAxisOrder,
    axisOrderCacheKey,
    setAxisOrderAndCacheKey,
  } = props;

  useUpdateAxisOrderAndCacheKey({
    resultsAxisOrder,
    axisDimension: yAxis,
    setAxisOrderAndCacheKey,
    axisOrderCacheKey,
  });

  const results = useFillGaps({
    results: props.results,
    dimension: yAxis,
  });

  const data = getBarStackedChartProData(
    {
      data: results?.data,
      dimension: yAxis,
      groupDimension: groupBy,
      measure,
      axisOrder,
    },
    theme,
  );

  const options = mergician(
    getBarStackedChartProOptions(
      {
        measures: [measure],
        groupDimension: groupBy,
        horizontal: true,
        data,
        dimension: yAxis,
      },
      theme,
    ),
    theme.charts?.barChartGroupedHorizontalPro?.options ?? {},
  );

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

  const handleClick = createGroupedClickHandler({
    data,
    dimension: yAxis,
    groupBy,
    granularity,
    onClicked: onBarClicked,
  });

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[measure, yAxis, groupBy]}
      errorMessage={results?.error || resultsAxisOrder?.error}
      {...asChartCardHeaderProps(resolvedI18nProps)}
    >
      {setGranularity && (
        <ChartGranularitySelectField
          hasMarginTop={granularitySelectorHasMarginTop}
          dimension={yAxis}
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
        reverseYAxis={reverseYAxis}
        xAxisRangeMin={xAxisRangeMin}
        xAxisRangeMax={xAxisRangeMax}
        showTotalLabels={showTotalLabels}
        options={options}
        onClick={handleClick}
        horizontal
      />
    </ChartCard>
  );
};

export default BarChartGroupedHorizontalPro;
