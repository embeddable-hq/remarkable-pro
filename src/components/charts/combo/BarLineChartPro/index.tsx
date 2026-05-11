import { Chart as ChartJS, LineController, LineElement, PointElement } from 'chart.js';
import { useTheme } from '@embeddable.com/react';
import { BarChart } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard } from '../../shared/ChartCard/ChartCard';
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
    showSecondaryAxis = false,
    yAxisSecondaryLabel,
    yAxisSecondaryMin,
    yAxisSecondaryMax,
    reverseXAxis,
    hideMenu,
    dimension,
    granularity,
    setGranularity,
    onBarClicked,
    onLineClicked,
  } = props;

  const { tooltip, description, title, xAxisLabel, yAxisLabel } = resolveI18nProps(props);

  const results = useFillGaps({ results: props.results, dimension });

  const data = getBarLineChartProData(
    {
      data: results.data,
      dimension,
      measures,
      lineMeasures,
      maxItems: xAxisMaxItems,
      showSecondaryAxis,
    },
    theme,
  );

  const options = getBarLineChartProOptions(
    {
      measures,
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
    measures,
    onBarClicked,
    onLineClicked,
  });

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[dimension, ...measures, ...lineMeasures]}
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
