import { useState } from 'react';
import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { getLineChartProData, getLineChartProOptions } from './LineChartTabbedPro.utils';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { LineChartProOptionsClick } from '../lines.utils';
import { LineChart } from '@embeddable.com/remarkable-ui';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';
import { MeasureTabs } from './components/MeasureTabs';

export type LineChartTabbedProPropsOnLineClicked = { axisDimensionValue: string | null };

export type LineChartTabbedProProps = {
  xAxis: Dimension;
  measures: Measure[];
  results: DataResponse;
  resultsTotals: DataResponse;
  reverseXAxis?: boolean;
  showLegend?: boolean;
  showLogarithmicScale?: boolean;
  showTooltips?: boolean;
  showValueLabels?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  yAxisRangeMax?: number;
  yAxisRangeMin?: number;
  setGranularity?: (granularity: Granularity) => void;
  onLineClicked?: LineChartProOptionsClick;
} & ChartCardHeaderProps;

const LineChartTabbedPro = (props: LineChartTabbedProProps) => {
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
    resultsTotals,
  } = props;

  const [activeMeasureIndex, setActiveMeasureIndex] = useState(0);

  const safeIndex = Math.min(activeMeasureIndex, measures.length - 1);
  const activeMeasure = measures[safeIndex]!;

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
      <MeasureTabs
        measures={measures}
        resultsTotals={resultsTotals}
        activeMeasureIndex={safeIndex}
        onTabClick={setActiveMeasureIndex}
        theme={theme}
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

export default LineChartTabbedPro;
