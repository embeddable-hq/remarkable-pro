import { useEffect, useState } from 'react';
import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { DataResponse } from '@embeddable.com/core';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import { ChartCard, asChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { ChartTabs, LineChart } from '@embeddable.com/remarkable-ui';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';
import { getComparisonKpiTabsItems } from './LineChartComparisonWithKpiTabsPro.utils';
import {
  createComparisonClickHandler,
  getLineChartComparisonProData,
  getLineChartComparisonProOptions,
} from '../LineChartComparisonDefaultPro/LineChartComparisonDefaultPro.utils';
import { LineChartComparisonDefaultProProps } from '../LineChartComparisonDefaultPro';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getComparisonPeriodDateRange } from '../../../utils/timeRange.utils';

export type LineChartComparisonWithKpiTabsProProps = LineChartComparisonDefaultProProps & {
  resultsKpis: DataResponse;
  resultsKpisComparison?: DataResponse;
};

const LineChartComparisonWithKpiTabsPro = (props: LineChartComparisonWithKpiTabsProProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const resolvedI18nProps = resolveI18nProps(props);
  const { title, description, tooltip, xAxisLabel, yAxisLabel } = resolvedI18nProps;
  const {
    measures,
    xAxis,
    reverseXAxis,
    showLegend,
    showLogarithmicScale,
    showTooltips,
    showValueLabels,
    yAxisRangeMax,
    yAxisRangeMin,
    comparisonPeriod,
    comparisonDateRange,
    showComparisonAxis,
    primaryDateRange,
    setGranularity,
    setComparisonDateRange,
    onLineClicked,
    resultsKpis,
    resultsKpisComparison,
  } = props;

  const [activeMeasureName, setActiveMeasureName] = useState(measures[0]?.name ?? '');
  const activeMeasure = measures.find((m) => m.name === activeMeasureName);

  useEffect(() => {
    if (measures.length === 0) return;
    if (measures.some((m) => m.name === activeMeasureName)) return;
    setActiveMeasureName(measures[0]!.name);
  }, [measures, activeMeasureName]);

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
      measures: activeMeasure ? [activeMeasure] : [],
      hasMinMaxYAxisRange: Boolean(yAxisRangeMin != null || yAxisRangeMax != null),
    },
    theme,
  );

  const options = getLineChartComparisonProOptions(
    {
      data,
      dimension: xAxis,
      measures: activeMeasure ? [activeMeasure] : [],
      xAxisLabel,
      showComparisonAxis,
      showDataComparison,
    },
    theme,
  );

  const handleClick = createComparisonClickHandler({
    data,
    measures: activeMeasure ? [activeMeasure] : [],
    dimension: xAxis,
    onClicked: onLineClicked,
  });

  const resultsCombined: DataResponse = {
    isLoading: Boolean(results.isLoading || resultsComparison?.isLoading),
    data:
      !results?.data && !resultsComparison?.data
        ? undefined
        : [...(results.data ?? []), ...(resultsComparison?.data ?? [])],
  };

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;
  const themeFormatter = getThemeFormatter(theme);

  const chartTabsItems = getComparisonKpiTabsItems({
    measures,
    resultsKpis,
    resultsKpisComparison,
    showDataComparison,
    themeFormatter,
  });

  return (
    <ChartCard
      data={resultsCombined}
      dimensionsAndMeasures={[...measures, xAxis]}
      errorMessage={results.error || resultsComparison?.error}
      {...asChartCardHeaderProps(resolvedI18nProps, props)}
    >
      <ChartTabs items={chartTabsItems} value={activeMeasureName} onChange={setActiveMeasureName} />
      {setGranularity && (
        <ChartGranularitySelectField
          hasMarginTop={granularitySelectorHasMarginTop}
          dimension={xAxis}
          onChange={setGranularity}
        />
      )}
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
        onClick={handleClick}
      />
    </ChartCard>
  );
};

export { LineChartComparisonWithKpiTabsPro };
export default LineChartComparisonWithKpiTabsPro;
