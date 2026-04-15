import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { DataResponse, Measure } from '@embeddable.com/core';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { KpiChart } from '@embeddable.com/remarkable-ui';
import { getKpiResults, getKpiValueFormatter } from '../kpis.utils';

export type KpiChartNumberProProp = {
  results: DataResponse;
  measure: Measure;
  fontSize?: number;
  displayNullAs?: string;
} & ChartCardHeaderProps;

const KpiChartNumberPro = (props: KpiChartNumberProProp) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const { title, description, tooltip, displayNullAs } = resolveI18nProps(props);
  const { measure, fontSize, hideMenu, results } = props;

  const value = results.data?.[0]?.[measure.name];

  const valueFormatter = getKpiValueFormatter({ measure }, theme);

  const resultsWithNullsHandled = getKpiResults(results, measure, Boolean(displayNullAs));

  return (
    <ChartCard
      data={resultsWithNullsHandled}
      dimensionsAndMeasures={[measure]}
      errorMessage={results.error}
      description={description}
      title={title}
      tooltip={tooltip}
      hideMenu={hideMenu}
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
