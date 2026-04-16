import { useState } from 'react';
import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { DataResponse } from '@embeddable.com/core';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import { ChartCard } from '../../shared/ChartCard/ChartCard';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { LineChart } from '@embeddable.com/remarkable-ui';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';
import { KpiTabs } from '../../shared/KpiTabs/KpiTabs';
import {
  getLineChartProData,
  getLineChartProOptions,
} from '../LineChartDefaultPro/LineChartDefaultPro.utils';
import { LineChartProProps } from '../LineChartDefaultPro';

export type LineChartWithKpiTabsProProps = LineChartProProps & {
  resultsKpis: DataResponse;
};

const LineChartWithKpiTabsPro = (props: LineChartWithKpiTabsProProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const { title, description, tooltip, xAxisLabel, yAxisLabel } = resolveI18nProps(props);
  const {
    hideMenu,
    measures,
    xAxis,
    reverseXAxis,
    showLegend,
    showLogarithmicScale,
    showTooltips,
    showValueLabels,
    yAxisRangeMax,
    yAxisRangeMin,
    setGranularity,
    onLineClicked,
    resultsKpis,
  } = props;

  const [activeMeasureName, setActiveMeasureName] = useState(measures[0]!.name);
  const activeMeasure = measures.find((m) => m.name === activeMeasureName) ?? measures[0]!;

  const results = useFillGaps({
    results: props.results,
    dimension: xAxis,
  });

  const data = getLineChartProData(
    {
      data: results.data,
      dimension: xAxis,
      measures: [activeMeasure],
      hasMinMaxYAxisRange: Boolean(yAxisRangeMin != null || yAxisRangeMax != null),
    },
    theme,
  );

  const options = getLineChartProOptions(
    { data, dimension: xAxis, measures: [activeMeasure], onLineClicked },
    theme,
  );

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[...measures, xAxis]}
      errorMessage={results.error}
      description={description}
      title={title}
      tooltip={tooltip}
      hideMenu={hideMenu}
    >
      <KpiTabs
        measures={measures}
        kpiValues={resultsKpis?.data?.[0]}
        activeMeasureName={activeMeasureName}
        onChange={setActiveMeasureName}
      />
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
      />
    </ChartCard>
  );
};

export default LineChartWithKpiTabsPro;
