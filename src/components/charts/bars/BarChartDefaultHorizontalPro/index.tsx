import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard } from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import { BarChart } from '@embeddable.com/remarkable-ui';
import { getBarChartProData, getBarChartProOptions } from '../bars.utils';
import { mergician } from 'mergician';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';
import { getElementAtEvent } from 'react-chartjs-2';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';
import { BarChartBaseProps } from '../bars.types';

export type BarChartDefaultHorizontalProProps = BarChartBaseProps & {
  reverseYAxis?: boolean;
  xAxisRangeMax?: number;
  xAxisRangeMin?: number;
  yAxisMaxItems?: number;
};

const BarChartDefaultHorizontalPro = (props: BarChartDefaultHorizontalProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    hideMenu,
    dimension,
    measures,
    showValueLabels,
    reverseYAxis,
    showLegend,
    showLogarithmicScale,
    showTooltips,
    xAxisRangeMax,
    xAxisRangeMin,
    yAxisMaxItems,
    granularity,
    setGranularity,
    onBarClicked,
  } = props;

  const { description, title, tooltip, xAxisLabel, yAxisLabel } = resolveI18nProps(props);

  const results = useFillGaps({
    results: props.results,
    dimension,
  });

  const data = getBarChartProData(
    { data: results.data, dimension, measures, maxItems: yAxisMaxItems },
    theme,
  );

  const options = mergician(
    getBarChartProOptions({ measures, horizontal: true, data, dimension }, theme), // Format X axis based on first measure
    theme.charts?.barChartDefaultHorizontalPro?.options ?? {},
  );

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
      dimension,
    });

    onBarClicked?.({
      dimensionValue,
      dimensionTimeRange,
    });
  };

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[dimension, ...measures]}
      errorMessage={results.error}
      description={description}
      title={title}
      tooltip={tooltip}
      hideMenu={hideMenu}
    >
      {setGranularity && (
        <ChartGranularitySelectField
          hasMarginTop={granularitySelectorHasMarginTop}
          dimension={dimension}
          onChange={setGranularity}
        />
      )}
      <BarChart
        horizontal
        data={data}
        options={options}
        reverseYAxis={reverseYAxis}
        showLegend={showLegend}
        showLogarithmicScale={showLogarithmicScale}
        showTooltips={showTooltips}
        showValueLabels={showValueLabels}
        xAxisLabel={xAxisLabel}
        xAxisRangeMax={xAxisRangeMax}
        xAxisRangeMin={xAxisRangeMin}
        yAxisLabel={yAxisLabel}
        onClick={handleClick}
      />
    </ChartCard>
  );
};

export default BarChartDefaultHorizontalPro;
