import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, asChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import { BarChart } from '@embeddable.com/remarkable-ui';
import { getBarChartProData, getBarChartProOptions } from '../bars.utils';
import { mergician } from 'mergician';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';
import { BarChartBaseProps } from '../bars.types';
import { createSimpleClickHandler } from '../../charts.utils';
import { DataResponse } from '@embeddable.com/core';
import { getMeasureTotals, isResultTruncated } from '../../charts.other.loadData.utils';

export type BarChartDefaultProProps = BarChartBaseProps & {
  reverseXAxis?: boolean;
  xAxisMaxItems?: number;
  maxResults?: number;
  yAxisRangeMin?: number;
  yAxisRangeMax?: number;
  resultsOtherTotal?: DataResponse;
};

const BarChartDefaultPro = (props: BarChartDefaultProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    measures,
    yAxisRangeMin,
    xAxisMaxItems,
    maxResults,
    yAxisRangeMax,
    showLegend,
    showTooltips,
    showLogarithmicScale,
    showValueLabels,
    reverseXAxis,
    dimension,
    granularity,
    setGranularity,
    onBarClicked,
    resultsOtherTotal,
  } = props;

  const resolvedI18nProps = resolveI18nProps(props);
  const { tooltip, description, title, xAxisLabel, yAxisLabel } = resolvedI18nProps;

  const results = useFillGaps({
    results: props.results,
    dimension,
  });

  // Truncation is judged from the raw query response (before gap-filling, which
  // can add synthetic rows). When truncated, the "Other" bucket for additive
  // measures is recovered from the full-dataset totals rather than the
  // incomplete front-end tail.
  const otherOptions = {
    isTruncated: isResultTruncated(props.results, maxResults),
    measureTotals: getMeasureTotals(resultsOtherTotal, measures),
  };

  const data = getBarChartProData(
    { data: results.data, dimension, measures, maxItems: xAxisMaxItems, otherOptions },
    theme,
  );

  const options = mergician(
    getBarChartProOptions({ measures, horizontal: false, data, dimension }, theme), // Format Y axis based on first measure
    theme.charts?.barChartDefaultPro?.options ?? {},
  );

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

  const handleClick = createSimpleClickHandler({
    data,
    dimension,
    granularity,
    onClicked: onBarClicked,
  });

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[dimension, ...measures]}
      errorMessage={results.error}
      {...asChartCardHeaderProps(props)}
    >
      {setGranularity && (
        <ChartGranularitySelectField
          hasMarginTop={granularitySelectorHasMarginTop}
          dimension={dimension}
          onChange={setGranularity}
        />
      )}
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
        onClick={handleClick}
      />
    </ChartCard>
  );
};

export default BarChartDefaultPro;
