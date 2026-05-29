import { useEffect, useState } from 'react';
import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { DataResponse } from '@embeddable.com/core';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import { ChartCard } from '../../shared/ChartCard/ChartCard';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { ChartTabs, ChartTabsProps, LineChart } from '@embeddable.com/remarkable-ui';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';
import {
  getLineChartProData,
  getLineChartProOptions,
} from '../LineChartDefaultPro/LineChartDefaultPro.utils';
import { LineChartProProps } from '../LineChartDefaultPro';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { createSimpleClickHandler } from '../../charts.utils';

export type LineChartWithKpiTabsProProps = LineChartProProps & {
  resultsKpis: DataResponse;
};

const LineChartWithKpiTabsPro = (props: LineChartWithKpiTabsProProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const { title, description, tooltip, xAxisLabel, yAxisLabel } = resolveI18nProps(props);
  const {
    hideMenu,
    exportOptions,
    measures,
    xAxis,
    reverseXAxis,
    showLegend,
    showLogarithmicScale,
    showTooltips,
    showValueLabels,
    yAxisRangeMax,
    yAxisRangeMin,
    granularity,
    setGranularity,
    onLineClicked,
    resultsKpis,
  } = props;

  const [activeMeasureName, setActiveMeasureName] = useState(measures[0]?.name ?? '');
  const activeMeasure = measures.find((m) => m.name === activeMeasureName);

  useEffect(() => {
    if (measures.length === 0) return;
    if (measures.some((m) => m.name === activeMeasureName)) return;
    setActiveMeasureName(measures[0]!.name);
  }, [measures, activeMeasureName]);

  const results = useFillGaps({
    results: props.results,
    dimension: xAxis,
  });

  const data = getLineChartProData(
    {
      data: results.data,
      dimension: xAxis,
      measures: activeMeasure ? [activeMeasure] : [],
      hasMinMaxYAxisRange: Boolean(yAxisRangeMin != null || yAxisRangeMax != null),
    },
    theme,
  );

  const options = getLineChartProOptions(
    { data, dimension: xAxis, measures: activeMeasure ? [activeMeasure] : [] },
    theme,
  );

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

  const handleClick = createSimpleClickHandler({
    data,
    dimension: xAxis,
    granularity,
    onClicked: onLineClicked,
  });

  const themeFormatter = getThemeFormatter(theme);

  const chartTabsItems: ChartTabsProps['items'] = measures.map((measure) => ({
    id: measure.name,
    label: themeFormatter.dimensionOrMeasureTitle(measure),
    value:
      resultsKpis?.data?.[0]?.[measure.name] == null
        ? '-'
        : themeFormatter.data(measure, resultsKpis.data[0][measure.name]),
  }));

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[...measures, xAxis]}
      errorMessage={results.error}
      description={description}
      title={title}
      tooltip={tooltip}
      hideMenu={hideMenu}
      exportOptions={exportOptions}
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

export default LineChartWithKpiTabsPro;
