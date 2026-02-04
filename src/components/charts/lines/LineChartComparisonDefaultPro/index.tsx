import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { DataResponse, Dimension, Granularity, Measure, TimeRange } from '@embeddable.com/core';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { useEffect } from 'react';
import { getComparisonPeriodDateRange } from '../../../utils/timeRange.utils';
import {
  getLineChartComparisonProData,
  getLineChartComparisonProOptions,
} from './LineChartComparisonDefaultPro.utils';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { LineChartProOptionsClick } from '../lines.utils';
import { LineChart } from '@embeddable.com/remarkable-ui';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';

type LineChartComparisonDefaultProProps = {
  xAxis: Dimension;
  measures: Measure[];
  results: DataResponse;
  resultsComparison: DataResponse | undefined;
  reverseXAxis?: boolean;
  showLegend?: boolean;
  showLogarithmicScale?: boolean;
  showTooltips?: boolean;
  showValueLabels?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  yAxisRangeMax?: number;
  yAxisRangeMin?: number;
  comparisonPeriod?: string;
  comparisonDateRange: TimeRange;
  showComparisonAxis?: boolean;
  primaryDateRange: TimeRange;
  setGranularity: (granularity: Granularity) => void;
  setComparisonDateRange?: (dateRange: TimeRange) => void;
  onLineClicked?: LineChartProOptionsClick;
} & ChartCardHeaderProps;

const LineChartComparisonDefaultPro = (props: LineChartComparisonDefaultProProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const { title, description, tooltip, xAxisLabel, yAxisLabel } = resolveI18nProps(props);
  const {
    hideMenu,
    comparisonPeriod,
    measures,
    xAxis,
    reverseXAxis,
    showLegend,
    showLogarithmicScale,
    showTooltips,
    showValueLabels,
    yAxisRangeMax,
    yAxisRangeMin,
    primaryDateRange,
    comparisonDateRange,
    showComparisonAxis,
    setGranularity,
    setComparisonDateRange,
    onLineClicked,
  } = props;

  useEffect(() => {
    const newComparisonDateRange = getComparisonPeriodDateRange(
      primaryDateRange,
      comparisonPeriod,
      theme,
    );
    setComparisonDateRange?.(newComparisonDateRange);
  }, [comparisonPeriod, JSON.stringify(primaryDateRange), theme]);

  const results = useFillGaps({
    results: props.results,
    dimension: xAxis,
    externalDateBounds: primaryDateRange,
  });

  const resultsComparison = useFillGaps({
    results: props.resultsComparison,
    dimension: xAxis,
    externalDateBounds: comparisonDateRange,
  });

  const showDataComparison = Boolean(primaryDateRange && comparisonPeriod);
  const data = getLineChartComparisonProData(
    {
      data: results.data,
      dataComparison: showDataComparison ? (resultsComparison?.data ?? []) : undefined,
      dimension: xAxis,
      measures,
      hasMinMaxYAxisRange: Boolean(yAxisRangeMin != null || yAxisRangeMax != null),
    },
    theme,
  );

  const options = getLineChartComparisonProOptions(
    {
      data: data,
      dimension: xAxis,
      measures,
      xAxisLabel,
      showComparisonAxis,
      showDataComparison,
      onLineClicked,
    },
    theme,
  );

  const resultsCombined: DataResponse = {
    isLoading: Boolean(results.isLoading || resultsComparison?.isLoading),
    data:
      !results?.data && !resultsComparison?.data
        ? undefined
        : [...(results.data ?? []), ...(resultsComparison?.data ?? [])],
  };

  return (
    <ChartCard
      data={resultsCombined}
      dimensionsAndMeasures={[...measures, xAxis]}
      errorMessage={results.error || resultsComparison?.error}
      description={description}
      title={title}
      hideMenu={hideMenu}
    >
      <ChartGranularitySelectField
        hasMarginTop={!title && !description && !tooltip}
        dimension={xAxis}
        onChange={setGranularity}
      />
      <LineChart
        data={data}
        reverseXAxis={reverseXAxis}
        showLegend={showLegend}
        showLogarithmicScale={showLogarithmicScale}
        showTooltips={showTooltips}
        showValueLabels={showValueLabels}
        xAxisLabel={xAxisLabel}
        yAxisLabel={yAxisLabel}
        yAxisRangeMax={yAxisRangeMax}
        yAxisRangeMin={yAxisRangeMin}
        options={options}
      />
    </ChartCard>
  );
};

export default LineChartComparisonDefaultPro;
