import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { getLineChartProData, getLineChartProOptions } from './LineChartDefaultPro.utils';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { LineChartProOptionsClick } from '../lines.types';
import { LineChart } from '@embeddable.com/remarkable-ui';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';
import { getElementAtEvent } from 'react-chartjs-2';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';

export type LineChartProPropsOnLineClicked = { axisDimensionValue: string | null };

export type LineChartProProps = {
  xAxis: Dimension;
  measures: Measure[];
  results: DataResponse;
  reverseXAxis?: boolean;
  showLegend?: boolean;
  showLogarithmicScale?: boolean;
  showTooltips?: boolean;
  showValueLabels?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  yAxisRangeMax?: number;
  yAxisRangeMin?: number;
  granularity?: Granularity;
  setGranularity?: (granularity: Granularity) => void;
  onLineClicked?: LineChartProOptionsClick;
} & ChartCardHeaderProps;

const LineChartPro = (props: LineChartProProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const { title, description, tooltip, xAxisLabel, yAxisLabel } = resolveI18nProps(props);
  const {
    hideMenu,
    measures,
    granularity,
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
  } = props;

  const results = useFillGaps({
    results: props.results,
    dimension: xAxis,
  });

  const data = getLineChartProData(
    {
      data: results.data,
      dimension: xAxis,
      measures,
      hasMinMaxYAxisRange: Boolean(yAxisRangeMin != null || yAxisRangeMax != null),
    },
    theme,
  );
  const options = getLineChartProOptions({ data, dimension: xAxis, measures }, theme);

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

  const handleClick = (
    event: React.MouseEvent<HTMLCanvasElement>,
    chartRef?: React.RefObject<null>,
  ) => {
    if (!chartRef?.current) return;
    const element = getElementAtEvent(chartRef.current, event)[0]!;

    // NOTE: for the future events feature
    // const measureValue = data?.datasets?.[element.datasetIndex]?.data?.[element.index];
    const dimensionValue = data?.labels?.[element?.index] as string | undefined;

    const dimensionTimeRange = getTimeRangeFromDimensionValue({
      value: dimensionValue,
      stateGranularity: granularity,
      dimension: xAxis,
    });

    onLineClicked?.({
      dimensionValue,
      dimensionTimeRange,
    });
  };

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

export default LineChartPro;
