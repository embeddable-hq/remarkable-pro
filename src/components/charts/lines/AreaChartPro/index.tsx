import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { getAreaChartProData, getAreaChartProOptions } from './AreaChartPro.utils';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { LineChartGroupedProOptionsClickArg } from '../lines.types';
import { LineChart } from '@embeddable.com/remarkable-ui';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';
import { ActiveElement, ChartEvent } from 'chart.js';

export type AreaChartProProps = {
  xAxis: Dimension;
  groupBy: Dimension;
  measure: Measure;
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
  onAreaClicked?: (arg: LineChartGroupedProOptionsClickArg) => void;
} & ChartCardHeaderProps;

const AreaChartPro = (props: AreaChartProProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const { title, description, tooltip, xAxisLabel, yAxisLabel } = resolveI18nProps(props);
  const {
    hideMenu,
    measure,
    xAxis,
    groupBy,
    reverseXAxis,
    showLegend,
    showLogarithmicScale,
    showTooltips,
    showValueLabels,
    yAxisRangeMax,
    yAxisRangeMin,
    granularity,
    setGranularity,
    onAreaClicked,
  } = props;

  const results = useFillGaps({
    results: props.results,
    dimension: xAxis,
  });

  const data = getAreaChartProData(
    {
      data: results.data,
      dimension: xAxis,
      groupDimension: groupBy,
      measure,
      hasMinMaxYAxisRange: Boolean(yAxisRangeMin != null || yAxisRangeMax != null),
    },
    theme,
  );

  const handleAreaClick = (event: ChartEvent, elements: ActiveElement[]) => {
    if (!elements.length || !onAreaClicked) return;
    const clickY = (event.native as MouseEvent | null)?.offsetY;

    const qualifying = clickY != null ? elements.filter((el) => el.element.y <= clickY) : elements;
    const element =
      qualifying.reduce<ActiveElement | undefined>(
        (max, el) => (!max || el.element.y > max.element.y ? el : max),
        undefined,
      ) ?? elements[0]!;

    const dimensionValue = data?.labels?.[element.index] as string | undefined;
    const groupingDimensionValue = (
      data?.datasets?.[element.datasetIndex] as { rawLabel?: string } | undefined
    )?.rawLabel;

    const clickArg: LineChartGroupedProOptionsClickArg = {
      dimensionValue,
      dimensionTimeRange: getTimeRangeFromDimensionValue({
        value: dimensionValue,
        stateGranularity: granularity,
        dimension: xAxis,
      }),
      groupingDimensionValue,
      groupingDimensionTimeRange: getTimeRangeFromDimensionValue({
        value: groupingDimensionValue,
        dimension: groupBy,
      }),
    };
    onAreaClicked(clickArg);
  };

  const options = {
    ...getAreaChartProOptions({ data, dimension: xAxis, groupDimension: groupBy, measure }, theme),
    interaction: { mode: 'index' as const, intersect: false },
    onClick: handleAreaClick,
  };

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[measure, xAxis, groupBy]}
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
      />
    </ChartCard>
  );
};

export default AreaChartPro;
