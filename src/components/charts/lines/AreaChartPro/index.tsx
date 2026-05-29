import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../../component.utils';
import { ChartCard } from '../../shared/ChartCard/ChartCard';
import { LineChartGroupedProProp } from '../LineChartGroupedPro';
import {
  createAreaClickHandler,
  getAreaChartProData,
  getAreaChartProOptions,
} from './AreaChartPro.utils';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { AreaChartProAreaClickArg, AreaChartProPointClickArg } from '../lines.types';
import { LineChart } from '@embeddable.com/remarkable-ui';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';

export type AreaChartProProps = Omit<LineChartGroupedProProp, 'onLineClicked'> & {
  onPointClicked?: (arg: AreaChartProPointClickArg) => void;
  onAreaClicked?: (arg: AreaChartProAreaClickArg) => void;
};

const AreaChartPro = (props: AreaChartProProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const { title, description, tooltip, xAxisLabel, yAxisLabel } = resolveI18nProps(props);
  const {
    hideMenu,
    exportOptions,
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
    onPointClicked,
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

  const handleClick = createAreaClickHandler({
    data,
    dimension: xAxis,
    groupBy,
    granularity,
    onPointClicked,
    onAreaClicked,
  });

  const options = getAreaChartProOptions(
    { data, dimension: xAxis, groupDimension: groupBy, measure },
    theme,
  );

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
      exportOptions={exportOptions}
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
