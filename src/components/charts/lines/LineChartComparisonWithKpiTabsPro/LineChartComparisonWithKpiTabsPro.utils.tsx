import { ReactNode } from 'react';
import { DataResponse, Measure } from '@embeddable.com/core';
import { ChartTabsProps, KpiTrend } from '@embeddable.com/remarkable-ui';
import { GetThemeFormatter } from '../../../../theme/formatter/formatter.utils';

type ComparisonKpiTabsParams = {
  measures: Measure[];
  resultsKpis: DataResponse | undefined;
  resultsKpisComparison: DataResponse | undefined;
  showDataComparison: boolean;
  themeFormatter: GetThemeFormatter;
};

export const getComparisonKpiTabsItems = ({
  measures,
  resultsKpis,
  resultsKpisComparison,
  showDataComparison,
  themeFormatter,
}: ComparisonKpiTabsParams): ChartTabsProps['items'] =>
  measures.map((measure) => {
    const kpiValue = resultsKpis?.data?.[0]?.[measure.name];
    const kpiComparisonValue = resultsKpisComparison?.data?.[0]?.[measure.name];
    const displayChangeAsPercentage = measure.inputs?.['displayChangeAsPercentage'] as
      boolean | undefined;
    const percentageDecimalPlaces = measure.inputs?.['percentageDecimalPlaces'] as
      number | undefined;
    return {
      id: measure.name,
      label: themeFormatter.dimensionOrMeasureTitle(measure),
      value: kpiValue == null ? '-' : themeFormatter.data(measure, kpiValue),
      slot: getKpiTrendSlot({
        measure,
        kpiValue,
        kpiComparisonValue,
        showDataComparison,
        displayChangeAsPercentage,
        percentageDecimalPlaces,
        themeFormatter,
      }),
    };
  });

const getKpiTrendSlot = ({
  measure,
  kpiValue,
  kpiComparisonValue,
  showDataComparison,
  displayChangeAsPercentage,
  percentageDecimalPlaces,
  themeFormatter,
}: {
  measure: Measure;
  kpiValue: unknown;
  kpiComparisonValue: unknown;
  showDataComparison: boolean;
  displayChangeAsPercentage?: boolean;
  percentageDecimalPlaces?: number;
  themeFormatter: GetThemeFormatter;
}): ReactNode => {
  if (!showDataComparison || kpiValue == null || kpiComparisonValue == null) return undefined;

  const diff = (kpiValue as number) - (kpiComparisonValue as number);
  const isPositive = diff > 0;
  // TODO(TPS-1470): `KpiTrend` only exposes a single `reverseTrend` boolean, which
  // drives both the badge color and the arrow icon. The "Reverse trend direction"
  // sub-input (see definition.ts) is ready to control the arrow independently, but
  // there's nothing to wire it to until `@embeddable.com/remarkable-ui`'s KpiTrend
  // exposes a separate direction control. Once it does, resolve it the same way as
  // KpiChartNumberComparisonPro does, via:
  //   resolveReverseTrendDirection(measure.inputs?.['reverseTrendDirection'], invertChangeColors)
  const reverseTrend = measure.inputs?.['invertChangeColors'] ? isPositive : !isPositive;
  const trendText = getTrendText({
    diff,
    kpiComparisonValue: kpiComparisonValue as number,
    displayChangeAsPercentage,
    percentageDecimalPlaces,
    measure,
    themeFormatter,
  });

  return <KpiTrend value={trendText} reverseTrend={reverseTrend} />;
};

const getTrendText = ({
  diff,
  kpiComparisonValue,
  displayChangeAsPercentage,
  percentageDecimalPlaces,
  measure,
  themeFormatter,
}: {
  diff: number;
  kpiComparisonValue: number;
  displayChangeAsPercentage?: boolean;
  percentageDecimalPlaces?: number;
  measure: Measure;
  themeFormatter: GetThemeFormatter;
}): string => {
  const isPositive = diff > 0;
  const sign = isPositive ? '+' : '';
  if (displayChangeAsPercentage && kpiComparisonValue !== 0) {
    const pct = (diff / kpiComparisonValue) * 100;
    return `${sign}${pct.toFixed(percentageDecimalPlaces ?? 1)}%`;
  }
  return `${sign}${themeFormatter.data(measure, diff)}`;
};
