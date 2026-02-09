import { useEffect, useState } from 'react';
import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import { BarChart } from '@embeddable.com/remarkable-ui';
import { getBarChartProData, getBarChartProOptions } from '../bars.utils';
import { mergician } from 'mergician';
import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';

type BarChartDefaultProProps = {
  dimension: Dimension;
  measures: Measure[];
  results: DataResponse;
  xAxisLabel?: string;
  xAxisMaxItems?: number;
  yAxisLabel?: string;
  yAxisRangeMin?: number;
  yAxisRangeMax?: number;
  showLegend?: boolean;
  showLogarithmicScale?: boolean;
  showTooltips?: boolean;
  showValueLabels?: boolean;
  reverseXAxis?: boolean;
  setGranularity: (granularity: Granularity) => void;
  onBarClicked?: (args: { axisDimensionValue: string | null }) => void;
} & ChartCardHeaderProps;

const BarChartDefaultPro = (props: BarChartDefaultProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  /*
  Here we check the theme for a `useCustomProps` hook. This allows the end user to provide a hook that can manipulate the props before they are used in the chart. This is useful for things like hitting an outside API to get additional data, manipulating the data in some way, or even just providing default values for certain props.

  The `useCustomProps` hook should take two arguments, the props, and an additional string telling it which chart is being rendered. This allows the hook to be used for multiple charts and manipulate the props differently based on the chart type.
  */
  const [customProps, setCustomProps] = useState<BarChartDefaultProProps>(props);

  useEffect(() => {
    const customPropsHook = theme.useCustomProps;
    if (customPropsHook) {
      customPropsHook<BarChartDefaultProProps>(props, 'BarChartDefaultPro').then((result) =>
        setCustomProps(result || props),
      );
    } else {
      setCustomProps(props);
    }
  }, [props, theme.useCustomProps]);

  const {
    measures,
    yAxisRangeMin,
    xAxisMaxItems,
    yAxisRangeMax,
    showLegend,
    showTooltips,
    showLogarithmicScale,
    showValueLabels,
    reverseXAxis,
    hideMenu,
    dimension,
    setGranularity,
    onBarClicked,
  } = customProps;

  const { tooltip, description, title, xAxisLabel, yAxisLabel } = resolveI18nProps(customProps);

  const results = useFillGaps({
    results: customProps.results,
    dimension,
  });

  const data = getBarChartProData(
    { data: results.data, dimension, measures, maxItems: xAxisMaxItems },
    theme,
  );

  const options = mergician(
    getBarChartProOptions({ measures, horizontal: false, onBarClicked, data, dimension }, theme), // Format Y axis based on first measure
    theme.charts?.barChartDefaultPro?.options || {},
  );

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

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
      <ChartGranularitySelectField
        hasMarginTop={granularitySelectorHasMarginTop}
        dimension={dimension}
        onChange={setGranularity}
      />
      <BarChart
        data={data}
        showLegend={showLegend}
        showTooltips={showTooltips}
        showValueLabels={showValueLabels}
        showLogarithmicScale={showLogarithmicScale}
        xAxisLabel={xAxisLabel}
        yAxisLabel={yAxisLabel}
        reverseXAxis={reverseXAxis}
        yAxisRangeMin={yAxisRangeMin}
        yAxisRangeMax={yAxisRangeMax}
        options={options}
      />
    </ChartCard>
  );
};

export default BarChartDefaultPro;
