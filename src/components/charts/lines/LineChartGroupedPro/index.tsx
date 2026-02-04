import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import {
  getLineChartGroupedProData,
  getLineChartGroupedProOptions,
} from './LineChartGroupedPro.utils';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { LineChartProOptionsClick } from '../lines.utils';
import { LineChart } from '@embeddable.com/remarkable-ui';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';

export type LineChartGroupedProPropsOnLineClicked = {
  axisDimensionValue: string | null;
  groupingDimensionValue: string | null;
};

type LineChartGroupedProProp = {
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
  setGranularity: (granularity: Granularity) => void;
  onLineClicked?: LineChartProOptionsClick;
} & ChartCardHeaderProps;

const LineChartGroupedPro = (props: LineChartGroupedProProp) => {
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
    { data, dimension: xAxis, measure, onLineClicked },
    theme,
  );

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
      <ChartGranularitySelectField
        hasMarginTop={!title && !description}
        dimension={xAxis}
        onChange={setGranularity}
      />
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

export default LineChartGroupedPro;
