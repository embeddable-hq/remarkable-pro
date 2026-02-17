import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { DataResponse, Measure, TimeRange } from '@embeddable.com/core';
import { i18n, i18nSetup } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { KpiChart } from '@embeddable.com/remarkable-ui';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { useEffect } from 'react';
import {
  getComparisonPeriodDateRange,
  getComparisonPeriodLabel,
} from '../../../utils/timeRange.utils';
import { getKpiResults } from '../kpis.utils';

export type KpiChartNumberComparisonProProp = {
  changeFontSize?: number;
  comparisonPeriod?: string;
  displayChangeAsPercentage?: boolean;
  fontSize?: number;
  measure: Measure;
  primaryDateRange: TimeRange;
  results: DataResponse;
  resultsComparison: DataResponse | undefined;
  reversePositiveNegativeColors?: boolean;
  percentageDecimalPlaces?: number;
  comparisonDateRange: TimeRange;
  displayNullAs?: string;
  setComparisonDateRange?: (dateRange: TimeRange) => void;
} & ChartCardHeaderProps;

const KpiChartNumberComparisonPro = (props: KpiChartNumberComparisonProProp) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const { title, description, tooltip, displayNullAs } = resolveI18nProps(props);
  const {
    hideMenu,
    changeFontSize,
    comparisonPeriod,
    comparisonDateRange,
    displayChangeAsPercentage,
    fontSize,
    measure,
    primaryDateRange,
    results,
    resultsComparison,
    reversePositiveNegativeColors,
    percentageDecimalPlaces,
    setComparisonDateRange,
  } = props;

  useEffect(() => {
    if (!setComparisonDateRange) return;

    const newComparisonDateRange = getComparisonPeriodDateRange(
      primaryDateRange,
      comparisonPeriod,
      theme,
    );
    setComparisonDateRange(newComparisonDateRange);
  }, [comparisonPeriod, JSON.stringify(primaryDateRange), theme]);

  const value: number = results.data?.[0]?.[measure.name];
  const comparisonValue = comparisonDateRange
    ? resultsComparison?.data?.[0]?.[measure.name]
    : undefined;

  const themeFormatter = getThemeFormatter(theme);
  const valueFormatter = (valueToFormat: number) => themeFormatter.data(measure, valueToFormat);
  const comparisonLabel = `vs ${getComparisonPeriodLabel(comparisonPeriod, theme).toLowerCase()}`;

  const resultsCombined: DataResponse = {
    isLoading: Boolean(results.isLoading || resultsComparison?.isLoading),
    data:
      !results?.data && !resultsComparison?.data
        ? undefined
        : [
            ...(results.data?.length
              ? [{ label: i18n.t('charts.primaryPeriod'), ...results.data[0] }]
              : []),
            ...(resultsComparison?.data?.length
              ? [{ label: i18n.t('charts.comparisonPeriod'), ...resultsComparison.data[0] }]
              : []),
          ],
  };

  const resultsWithNullsHandled = getKpiResults(resultsCombined, measure, Boolean(displayNullAs));

  return (
    <ChartCard
      data={resultsWithNullsHandled}
      dimensionsAndMeasures={[
        // Add a label dimension to distinguish primary and comparison periods in exports
        {
          name: 'label',
          title: i18n.t('charts.label'),
          nativeType: 'string',
          __type__: 'dimension',
        },
        measure,
      ]}
      errorMessage={results.error}
      description={description}
      title={title}
      tooltip={tooltip}
      hideMenu={hideMenu}
    >
      <KpiChart
        displayNullAs={displayNullAs}
        value={value}
        comparisonValue={resultsCombined.isLoading ? undefined : comparisonValue}
        valueFormatter={valueFormatter}
        valueFontSize={fontSize}
        trendFontSize={changeFontSize}
        invertChangeColors={reversePositiveNegativeColors}
        showChangeAsPercentage={displayChangeAsPercentage}
        comparisonLabel={comparisonLabel}
        percentageDecimalPlaces={percentageDecimalPlaces}
        noPreviousDataLabel={i18n.t('charts.kpiChart.noPreviousData')}
        equalComparisonLabel={i18n.t('charts.kpiChart.equalComparison')}
      />
    </ChartCard>
  );
};

export default KpiChartNumberComparisonPro;
