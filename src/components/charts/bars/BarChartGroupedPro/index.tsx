import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard } from '../../shared/ChartCard/ChartCard';
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

export type BarChartGroupedProProps = BarChartStackedBaseProps & {
  xAxis: Dimension;
  reverseXAxis?: boolean;
  yAxisRangeMax?: number;
  yAxisRangeMin?: number;
};

const BarChartGroupedPro = (props: BarChartGroupedProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const { tooltip, description, title, xAxisLabel, yAxisLabel } = resolveI18nProps(props);

  const {
    hideMenu,
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
    axisDimension: xAxis,
    setAxisOrderAndCacheKey,
    axisOrderCacheKey,
  });

  const results = useFillGaps({
    results: props.results,
    dimension: xAxis,
  });

  const data = getBarStackedChartProData(
    {
      data: results?.data,
      dimension: xAxis,
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
        horizontal: false,
        data,
        dimension: xAxis,
        groupDimension: groupBy,
      },
      theme,
    ),
    theme.charts?.barChartGroupedPro?.options ?? {},
  );

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

  const handleClick = createGroupedClickHandler({
    data,
    dimension: xAxis,
    groupBy,
    granularity,
    onClicked: onBarClicked,
  });

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[measure, xAxis, groupBy]}
      errorMessage={results?.error || resultsAxisOrder?.error}
      description={description}
      title={title}
      tooltip={tooltip}
      hideMenu={hideMenu}
    >
      {setGranularity && (
        <ChartGranularitySelectField
          hasMarginTop={granularitySelectorHasMarginTop}
          dimension={xAxis}
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
        showTotalLabels={showTotalLabels}
        options={options}
        onClick={handleClick}
      />
    </ChartCard>
  );
};

export default BarChartGroupedPro;
