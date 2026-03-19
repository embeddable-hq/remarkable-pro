import { Chart as ChartJS, ChartData, ChartOptions, LineElement, PointElement } from 'chart.js';
import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import { BarChart, getChartColors } from '@embeddable.com/remarkable-ui';
import { mergician } from 'mergician';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import { ChartCard, ChartCardHeaderProps } from '../../shared/ChartCard/ChartCard';
import { resolveI18nProps } from '../../../component.utils';
import { getBarChartProOptions } from '../bars.utils';
import { getDimensionMeasureColor } from '../../../../theme/styles/styles.utils';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { groupTailAsOther } from '../../charts.utils';
import { useFillGaps } from '../../charts.fillGaps.hooks';
import { ChartGranularitySelectField } from '../../shared/ChartGranularitySelectField/ChartGranularitySelectField';

// Register elements required for mixed bar+line rendering
ChartJS.register(LineElement, PointElement);

export type BarChartDefaultWithLineProProps = {
  dimension: Dimension;
  measures: Measure[];
  lineMeasures?: Measure[];
  results: DataResponse;
  xAxisLabel?: string;
  xAxisMaxItems?: number;
  yAxisLabel?: string;
  yAxisLabelSecondary?: string;
  yAxisRangeMin?: number;
  yAxisRangeMax?: number;
  showLegend?: boolean;
  showLogarithmicScale?: boolean;
  showTooltips?: boolean;
  showValueLabels?: boolean;
  showValueLabelsLine?: boolean;
  showSecondYAxis?: boolean;
  reverseXAxis?: boolean;
  setGranularity?: (granularity: Granularity) => void;
  onBarClicked?: (args: { axisDimensionValue: string | null }) => void;
} & ChartCardHeaderProps;

// Combine the bar and line data into a single ChartData object suitable for Chart.js
const buildComboChartData = (
  data: DataResponse['data'],
  dimension: Dimension,
  measures: Measure[],
  lineMeasures: Measure[],
  maxItems: number | undefined,
  showSecondYAxis: boolean,
  theme: Theme,
): ChartData<'bar'> => {
  if (!data) {
    return { labels: [], datasets: [{ data: [] }] };
  }

  const allMeasures = [...measures, ...lineMeasures];
  const groupedData = groupTailAsOther(data, dimension, allMeasures, maxItems);
  const themeFormatter = getThemeFormatter(theme);
  const chartColors = getChartColors();

  const labels = groupedData.map((item) => item[dimension.name]);

  const barDatasets = measures.map((measure, index) => ({
    order: 1,
    label: themeFormatter.dimensionOrMeasureTitle(measure),
    data: groupedData.map((item) => item[measure.name] ?? 0),
    backgroundColor: getDimensionMeasureColor({
      dimensionOrMeasure: measure,
      theme,
      color: 'background',
      value: measure.name,
      index,
      chartColors,
    }),
    borderColor: getDimensionMeasureColor({
      dimensionOrMeasure: measure,
      theme,
      color: 'border',
      value: measure.name,
      index,
      chartColors,
    }),
  }));

  const lineDatasets = lineMeasures.map((measure, index) => {
    const colorIndex = measures.length + index;
    const color = getDimensionMeasureColor({
      dimensionOrMeasure: measure,
      theme,
      color: 'background',
      value: measure.name,
      index: colorIndex,
      chartColors,
    });
    return {
      type: 'line' as const,
      label: themeFormatter.dimensionOrMeasureTitle(measure),
      data: groupedData.map((item) => item[measure.name] ?? 0),
      backgroundColor: color,
      borderColor: color,
      pointRadius: 2,
      pointHoverRadius: 3,
      yAxisID: showSecondYAxis ? 'y1' : 'y',
    };
  });

  // Chart.js supports mixed-type datasets but TS's ChartData<'bar'> doesn't, so we cast.
  return {
    labels,
    datasets: [...barDatasets, ...lineDatasets] as ChartData<'bar'>['datasets'],
  };
};

const BarChartDefaultWithLinePro = (props: BarChartDefaultWithLineProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    measures,
    lineMeasures = [],
    yAxisRangeMin,
    xAxisMaxItems,
    yAxisRangeMax,
    showLegend,
    showTooltips,
    showLogarithmicScale,
    showValueLabels,
    showValueLabelsLine,
    showSecondYAxis = false,
    yAxisLabelSecondary,
    reverseXAxis,
    hideMenu,
    dimension,
    setGranularity,
    onBarClicked,
  } = props;

  const { tooltip, description, title, xAxisLabel, yAxisLabel } = resolveI18nProps(props);

  const results = useFillGaps({ results: props.results, dimension });

  const data = buildComboChartData(
    results.data,
    dimension,
    measures,
    lineMeasures,
    xAxisMaxItems,
    showSecondYAxis,
    theme,
  );

  const allMeasures = [...measures, ...lineMeasures];

  const secondaryAxisOptions: Partial<ChartOptions<'bar'>> = showSecondYAxis
    ? {
        scales: {
          y1: {
            type: 'linear',
            position: 'right',
            title: {
              display: Boolean(yAxisLabelSecondary),
              text: yAxisLabelSecondary ?? '',
            },
            grid: { drawOnChartArea: false },
          },
        },
      }
    : {};

  const valueLabelsOptions: Partial<ChartOptions<'bar'>> = {
    plugins: {
      datalabels: {
        display: (context) => {
          const isLineSeries = context.datasetIndex >= measures.length;
          const show = isLineSeries ? showValueLabelsLine : showValueLabels;
          return show && context.dataset.data[context.dataIndex] !== 0 ? 'auto' : false;
        },
      },
    },
  };

  const options = mergician(
    getBarChartProOptions(
      { measures: allMeasures, horizontal: false, onBarClicked, data, dimension },
      theme,
    ),
    secondaryAxisOptions,
    valueLabelsOptions,
    theme.charts?.barChartDefaultWithLinePro?.options ?? {},
  );

  const granularitySelectorHasMarginTop = !title && !description && !tooltip;

  return (
    <ChartCard
      data={results}
      dimensionsAndMeasures={[dimension, ...allMeasures]}
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

export default BarChartDefaultWithLinePro;
