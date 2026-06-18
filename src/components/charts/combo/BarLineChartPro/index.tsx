import { Chart as ChartJS, LineController, LineElement, PointElement } from 'chart.js';
import { useTheme } from '@embeddable.com/react';
import { BarChart } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, asChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { resolveI18nProps } from '../../../component.utils';
import { BarLineChartProProps } from '../combo.types';
import {
  createBarLineClickHandler,
  getBarLineChartProData,
  getBarLineChartProOptions,
} from './BarLineChartPro.utils';

ChartJS.register(LineController, LineElement, PointElement);

const BarLineChartPro = (props: BarLineChartProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    measures,
    lineMeasures = [],
    xAxisMaxItems,
    yAxisRangeMin,
    yAxisRangeMax,
    showLegend,
    showTooltips,
    showLogarithmicScale,
    showValueLabels,
    showValueLabelsLine,
    yAxisSecondaryLabel,
    yAxisSecondaryMin,
    yAxisSecondaryMax,
    reverseXAxis,
    dimension,
    granularity,
    setGranularity,
    onBarClicked,
    onLineClicked,
  } = props;

  const resolvedI18nProps = resolveI18nProps(props);
  const { tooltip, description, title, xAxisLabel, yAxisLabel } = resolvedI18nProps;

  const showSecondaryAxis = lineMeasures.some((m) => Boolean(m.inputs?.['useSecondaryAxis']));

  const results = useFillGaps({ results: props.results, dimension });

  const data = getBarLineChartProData(
    {
      data: results.data,
      dimension,
      barMeasures: measures,
      lineMeasures,
      maxItems: xAxisMaxItems,
      showSecondaryAxis,
    },
    theme,
  );

  const options = getBarLineChartProOptions(
    {
      barMeasures: measures,
      lineMeasures,
      dimension,
      data,
      showSecondaryAxis,
      showValueLabels,
      showValueLabelsLine,
      yAxisSecondaryLabel,
      yAxisSecondaryMin,
      yAxisSecondaryMax,
    },
    theme,
  );

  const handleClick = createBarLineClickHandler({
    data,
    dimension,
    granularity,
    barMeasures: measures,
    onBarClicked,
    onLineClicked,
  });

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[dimension, ...measures, ...lineMeasures]}
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
        showValueLabels={showValueLabels || showValueLabelsLine}
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

export default BarLineChartPro;
export type { BarLineChartProProps };
