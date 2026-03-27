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
import { useEffect } from 'react';

export type BarChartStackedProProps = {
  groupBy: Dimension;
  maxLegendItems?: number;
  measure: Measure;
  results?: DataResponse;
  reverseXAxis?: boolean;
  showLegend?: boolean;
  showLogarithmicScale?: boolean;
  showTotalLabels?: boolean;
  showTooltips?: boolean;
  showValueLabels?: boolean;
  xAxis: Dimension;
  xAxisLabel?: string;
  yAxisLabel?: string;
  yAxisRangeMax?: number;
  yAxisRangeMin?: number;
  setGranularity?: (granularity: Granularity) => void;
  onBarClicked?: (args: {
    axisDimensionValue: string | null;
    groupingDimensionValue: string | null;
  }) => void;
  totals?: DataResponse;
  totalsKey?: string;
  setAxisTotalValues?: (values: string[], key?: string) => void;
} & ChartCardHeaderProps;

const BarChartStackedPro = (props: BarChartStackedProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);
  const { tooltip, description, title, xAxisLabel, yAxisLabel } = resolveI18nProps(props);

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
    totals,
    totalsKey,
    setAxisTotalValues,
  } = props;

  const { hideMenu } = props;

  useEffect(() => {
    if (!totals?.data || totals.isLoading || !setAxisTotalValues) return;
    const values = totals.data.map((d) => d[xAxis.name] as string);
    setAxisTotalValues(values, totalsKey);
  }, [totals, xAxis.name, setAxisTotalValues, totalsKey]);

  const results =
    useFillGaps({
      results: props.results,
      dimension: props.xAxis,
    }) ?? ({ isLoading: true, data: [] } as DataResponse);

  const axisOrder = totals?.data?.map((d) => d[xAxis.name] as string);

  const data = getBarStackedChartProData(
    {
      data: results.data,
      dimension: xAxis,
      groupDimension: groupBy,
      measure,
      axisOrder,
    },
    theme,
  );

  const options = mergician(
    getBarChartProOptions(
      { measures: [measure], horizontal: false, onBarClicked, data, dimension: xAxis },
      theme,
    ),
    theme.charts?.barChartStackedPro?.options || {},
  );

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

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
        stacked
      />
    </ChartCard>
  );
};

export default BarChartStackedPro;
