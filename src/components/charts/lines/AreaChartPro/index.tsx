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
import { createGroupedClickHandler } from '../../charts.utils';

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
  const options = getAreaChartProOptions(
    { data, dimension: xAxis, groupDimension: groupBy, measure },
    theme,
  );

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

  const groupedClickHandler = createGroupedClickHandler({
    data,
    dimension: xAxis,
    groupBy,
    granularity,
    onClicked: (value) => {
      console.log('[AreaChartPro] onAreaClicked', value);
      onAreaClicked?.(value);
    },
  });

  const handleClick: typeof groupedClickHandler = (args) =>
    groupedClickHandler({
      ...args,
      elementAtEvent: args.elementAtEvent.length ? args.elementAtEvent : args.elementsAtEvent,
    });

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
        onClick={handleClick}
      />
    </ChartCard>
  );
};

export default AreaChartPro;
