import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import {
  ChartCard,
  ChartCardHeaderProps,
  asChartCardHeaderProps,
} from '../../shared/ChartCard/ChartCard';
import {
  getLineChartGroupedProData,
  getLineChartGroupedProOptions,
} from './LineChartGroupedPro.utils';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { LineChartGroupedProOptionsClickArg } from '../lines.types';
import { LineChart } from '@embeddable.com/remarkable-ui';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';
import { createGroupedClickHandler } from '../../charts.utils';

export type LineChartGroupedProProp = {
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
  onLineClicked?: (arg: LineChartGroupedProOptionsClickArg) => void;
} & ChartCardHeaderProps;

const LineChartGroupedPro = (props: LineChartGroupedProProp) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const resolvedI18nProps = resolveI18nProps(props);
  const { title, description, tooltip, xAxisLabel, yAxisLabel } = resolvedI18nProps;
  const {
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
    onLineClicked,
  } = props;

  const results = useFillGaps({
    results: props.results,
    dimension: props.xAxis,
  });

  const data = getLineChartGroupedProData(
    {
      data: results.data,
      dimension: xAxis,
      groupDimension: groupBy,
      measure,
      hasMinMaxYAxisRange: Boolean(yAxisRangeMin != null || yAxisRangeMax != null),
    },
    theme,
  );
  const options = getLineChartGroupedProOptions(
    { data, dimension: xAxis, groupDimension: groupBy, measure },
    theme,
  );

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

  const handleClick = createGroupedClickHandler({
    data,
    dimension: xAxis,
    groupBy,
    granularity,
    onClicked: onLineClicked,
  });

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[measure, xAxis, groupBy]}
      errorMessage={results.error}
      {...asChartCardHeaderProps(resolvedI18nProps, props)}
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

export default LineChartGroupedPro;
