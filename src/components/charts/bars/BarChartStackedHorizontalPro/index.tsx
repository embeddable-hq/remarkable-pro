import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard } from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import { BarChart, ChartClickArgs } from '@embeddable.com/remarkable-ui';
import { getBarStackedChartProData, getBarStackedChartProOptions } from '../bars.utils';
import { mergician } from 'mergician';
import { Dimension } from '@embeddable.com/core';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';
import { useUpdateAxisOrderAndCacheKey } from '../bars.hooks';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';
import { BarChartStackedBaseProps } from '../bars.types';

export type BarChartStackedHorizontalProProps = BarChartStackedBaseProps & {
  yAxis: Dimension;
  reverseYAxis?: boolean;
  xAxisRangeMax?: number;
  xAxisRangeMin?: number;
};

const BarChartStackedHorizontalPro = (props: BarChartStackedHorizontalProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const { tooltip, description, title, xAxisLabel, yAxisLabel } = resolveI18nProps(props);

  const {
    hideMenu,
    groupBy,
    measure,
    reverseYAxis,
    showLegend,
    showLogarithmicScale,
    showTooltips,
    showTotalLabels,
    showValueLabels,
    yAxis,
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
    theme.charts?.barChartStackedHorizontalPro?.options || {},
  );

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

  const handleClick = ({ elementAtEvent }: ChartClickArgs) => {
    const element = elementAtEvent[0]!;

    const dimensionValue = data?.labels?.[element?.index] as string | undefined;
    const groupingDimensionValue = (
      data?.datasets?.[element?.datasetIndex] as { rawLabel?: string } | undefined
    )?.rawLabel;

    const dimensionTimeRange = getTimeRangeFromDimensionValue({
      value: dimensionValue,
      stateGranularity: granularity,
      dimension: yAxis,
    });

    const groupingDimensionTimeRange = getTimeRangeFromDimensionValue({
      value: groupingDimensionValue,
      dimension: groupBy,
    });

    onBarClicked?.({
      dimensionValue,
      dimensionTimeRange,
      groupingDimensionValue,
      groupingDimensionTimeRange,
    });
  };

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[measure, yAxis, groupBy]}
      errorMessage={results?.error || resultsAxisOrder?.error}
      description={description}
      title={title}
      tooltip={tooltip}
      hideMenu={hideMenu}
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
        stacked
        horizontal
      />
    </ChartCard>
  );
};

export default BarChartStackedHorizontalPro;
