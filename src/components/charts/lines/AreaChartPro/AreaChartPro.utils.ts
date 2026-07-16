import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { Chart, ChartData, ChartOptions } from 'chart.js';
import { mergician } from 'mergician';
import {
  getLineChartGroupedProData,
  getLineChartGroupedProOptions,
} from '../LineChartGroupedPro/LineChartGroupedPro.utils';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';
import { dispatchEventUserInteraction } from '../../../../utils/events.utils';
import { setColorAlpha } from '../../../../utils/color.utils';
import { AreaChartProAreaClickArg, AreaChartProPointClickArg } from '../lines.types';
import { ChartClickArgs } from '@embeddable.com/remarkable-ui';

export const getAreaChartProData = (
  props: {
    data: DataResponse['data'];
    dimension: Dimension;
    groupDimension: Dimension;
    measure: Measure;
    hasMinMaxYAxisRange: boolean;
  },
  theme: Theme,
): ChartData<'line'> => {
  const data = getLineChartGroupedProData(props, theme);

  return {
    ...data,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      fill: true,
      backgroundColor: setColorAlpha(dataset.backgroundColor as string, 0.9),
    })),
  };
};

type PixelPoint = { x: number; y: number };

const getPixelPoints = (chart: Chart, datasetIndex: number): PixelPoint[] =>
  chart.getDatasetMeta(datasetIndex).data;

const interpolateLineY = (chart: Chart, datasetIndex: number, clickX: number): number | null => {
  const points = getPixelPoints(chart, datasetIndex);
  for (let i = 0; i < points.length - 1; i++) {
    const left = points[i]!;
    const right = points[i + 1]!;
    if (left.x <= clickX && right.x >= clickX) {
      const t = (clickX - left.x) / (right.x - left.x);
      return left.y + t * (right.y - left.y);
    }
  }
  const last = points.at(-1);
  return last?.x === clickX ? last.y : null;
};

const handlePointClick = ({
  chart,
  elementAtEvent,
  clickY,
  data,
  dimension,
  measure,
  groupBy,
  granularity,
  componentName,
  trackingId,
  onPointClicked,
}: {
  chart: Chart;
  elementAtEvent: ChartClickArgs['elementAtEvent'];
  clickY: number;
  data: ChartData<'line'>;
  dimension: Dimension;
  measure: Measure;
  groupBy: Dimension;
  granularity: Granularity | undefined;
  componentName: string | undefined;
  trackingId: string | undefined;
  onPointClicked: (arg: AreaChartProPointClickArg) => void;
}): boolean => {
  if (!elementAtEvent.length) return false;

  const clicked = elementAtEvent[0]!;
  const pointY = getPixelPoints(chart, clicked.datasetIndex)[clicked.index]?.y;
  if (pointY == null) return false;

  if (Math.abs(clickY - pointY) > 8) return false;

  let dimensionValue = data?.labels?.[clicked.index] as string | undefined;
  const dimensionTimeRange = getTimeRangeFromDimensionValue({
    value: dimensionValue,
    stateGranularity: granularity,
    dimension,
  });

  if (dimensionTimeRange) {
    dimensionValue = undefined;
  }

  const measureValue = (data?.datasets?.[clicked.datasetIndex] as { data?: unknown[] })?.data?.[
    clicked.index
  ] as number | undefined;

  let dimensionGroupByValue = (data?.datasets?.[clicked.datasetIndex] as { rawLabel?: string })
    ?.rawLabel;
  const dimensionGroupByTimeRange = getTimeRangeFromDimensionValue({
    value: dimensionGroupByValue,
    dimension: groupBy,
  });

  if (dimensionGroupByTimeRange) {
    dimensionGroupByValue = undefined;
  }

  dispatchEventUserInteraction({
    componentName,
    trackingId,
    dimension,
    dimensionValue,
    dimensionTimeRange,
    dimensionGroupBy: groupBy,
    dimensionGroupByValue,
    measure,
    measureValue,
  });

  onPointClicked({
    dimensionValue,
    dimensionTimeRange,
    measureValue,
  });
  return true;
};

const handleAreaClick = ({
  chart,
  clickX,
  clickY,
  data,
  groupBy,
  componentName,
  trackingId,
  onAreaClicked,
}: {
  chart: Chart;
  clickX: number;
  clickY: number;
  data: ChartData<'line'>;
  groupBy: Dimension;
  componentName: string | undefined;
  trackingId: string | undefined;
  onAreaClicked: (arg: AreaChartProAreaClickArg) => void;
}): void => {
  const chartBottom = chart.chartArea?.bottom ?? Infinity;

  for (let i = chart.data.datasets.length - 1; i >= 0; i--) {
    const lineY = interpolateLineY(chart, i, clickX);
    const baseY = i > 0 ? interpolateLineY(chart, i - 1, clickX) : chartBottom;
    if (lineY == null || baseY == null) continue;
    if (clickY < Math.min(lineY, baseY) || clickY > Math.max(lineY, baseY)) continue;

    let groupingDimensionValue = (data?.datasets?.[i] as { rawLabel?: string })?.rawLabel;
    const groupingDimensionTimeRange = getTimeRangeFromDimensionValue({
      value: groupingDimensionValue,
      dimension: groupBy,
    });

    if (groupingDimensionTimeRange) {
      groupingDimensionValue = undefined;
    }

    dispatchEventUserInteraction({
      componentName,
      trackingId,
      dimension: groupBy,
      groupingDimensionValue,
      groupingDimensionTimeRange,
    });

    onAreaClicked({
      groupingDimensionValue,
      groupingDimensionTimeRange,
    });
    return;
  }
};

export const createAreaClickHandler =
  ({
    data,
    dimension,
    measure,
    groupBy,
    granularity,
    componentName,
    trackingId,
    onPointClicked,
    onAreaClicked,
  }: {
    data: ChartData<'line'>;
    dimension: Dimension;
    measure: Measure;
    groupBy: Dimension;
    granularity?: Granularity;
    componentName?: string;
    trackingId?: string;
    onPointClicked?: (arg: AreaChartProPointClickArg) => void;
    onAreaClicked?: (arg: AreaChartProAreaClickArg) => void;
  }) =>
  ({ event, elementAtEvent }: ChartClickArgs): void => {
    const chart = Chart.getChart(event.target as HTMLCanvasElement);
    if (!chart) return;

    const clickX = event.nativeEvent.offsetX;
    const clickY = event.nativeEvent.offsetY;

    if (
      onPointClicked &&
      handlePointClick({
        chart,
        elementAtEvent,
        clickY,
        data,
        dimension,
        measure,
        groupBy,
        granularity,
        componentName,
        trackingId,
        onPointClicked,
      })
    )
      return;
    if (onAreaClicked)
      handleAreaClick({
        chart,
        clickX,
        clickY,
        data,
        groupBy,
        componentName,
        trackingId,
        onAreaClicked,
      });
  };

export const getAreaChartProOptions = (
  options: {
    dimension: Dimension;
    groupDimension: Dimension;
    measure: Measure;
    data: ChartData<'line'>;
  },
  theme: Theme,
): ChartOptions<'line'> => {
  const lineOptions = getLineChartGroupedProOptions(options, theme);

  return mergician(lineOptions, {
    scales: { y: { stacked: true } },
    interaction: { mode: 'index' as const, intersect: false },
    ...(theme.charts?.areaChartPro?.options || {}),
  });
};
