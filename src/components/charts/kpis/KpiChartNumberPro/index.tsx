import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { DataResponse, Measure } from '@embeddable.com/core';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import {
  ChartCard,
  ChartCardHeaderProps,
  asChartCardHeaderProps,
} from '../../shared/ChartCard/ChartCard';
import { KpiChart } from '@embeddable.com/remarkable-ui';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getKpiResults } from '../kpis.utils';

export type KpiChartNumberProProp = {
  results: DataResponse;
  measure: Measure;
  fontSize?: number;
  displayNullAs?: string;
} & ChartCardHeaderProps;

const KpiChartNumberPro = (props: KpiChartNumberProProp) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const resolvedI18nProps = resolveI18nProps(props);
  const { displayNullAs } = resolvedI18nProps;
  const { measure, fontSize, results } = props;

  const value = results.data?.[0]?.[measure.name];

  const themeFormatter = getThemeFormatter(theme);
  const valueFormatter = (valueToFormat: number) => themeFormatter.data(measure, valueToFormat);

  const resultsWithNullsHandled = getKpiResults(results, measure, Boolean(displayNullAs));

  return (
    <ChartCard
      data={resultsWithNullsHandled}
      dimensionsAndMeasures={[measure]}
      errorMessage={results.error}
      {...asChartCardHeaderProps(resolvedI18nProps, props)}
    >
      <KpiChart
        displayNullAs={displayNullAs}
        value={value}
        valueFormatter={valueFormatter}
        valueFontSize={fontSize}
      />
    </ChartCard>
  );
};

export default KpiChartNumberPro;
