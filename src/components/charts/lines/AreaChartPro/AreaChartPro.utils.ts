import { DataResponse, Dimension, Granularity, Measure } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { ActiveElement, Chart, ChartData, ChartEvent, ChartOptions } from 'chart.js';
import { mergician } from 'mergician';
import {
  getLineChartGroupedProData,
  getLineChartGroupedProOptions,
} from '../LineChartGroupedPro/LineChartGroupedPro.utils';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';
import { setColorAlpha } from '../../../../utils/color.utils';
import { AreaChartProAreaClickArg, AreaChartProPointClickArg } from '../lines.types';

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

const handlePointClick = (
  chart: Chart,
  event: ChartEvent,
  data: ChartData<'line'>,
  dimension: Dimension,
  granularity: Granularity | undefined,
  onPointClicked: (arg: AreaChartProPointClickArg) => void,
): boolean => {
  const pointElements = chart.getElementsAtEventForMode(
    event.native as Event,
    'nearest',
    { intersect: true },
    false,
  );
  if (!pointElements.length) return false;

  const clicked = pointElements[0]!;
  const pointY = getPixelPoints(chart, clicked.datasetIndex)[clicked.index]?.y;
  if (pointY == null) return false;

  const isOnPoint = event.y == null || Math.abs(event.y - pointY) <= 8;
  if (!isOnPoint) return false;

  const dimensionValue = data?.labels?.[clicked.index] as string | undefined;
  const measureValue = (data?.datasets?.[clicked.datasetIndex] as { data?: unknown[] })?.data?.[
    clicked.index
  ] as number | undefined;

  onPointClicked({
    dimensionValue,
    dimensionTimeRange: getTimeRangeFromDimensionValue({
      value: dimensionValue,
      stateGranularity: granularity,
      dimension,
    }),
    measureValue,
  });
  return true;
};

const handleAreaClick = (
  chart: Chart,
  event: ChartEvent,
  data: ChartData<'line'>,
  groupBy: Dimension,
  onAreaClicked: (arg: AreaChartProAreaClickArg) => void,
): void => {
  const { x: clickX, y: clickY } = event;
  if (clickX == null || clickY == null) return;

  const chartBottom = chart.chartArea?.bottom ?? Infinity;

  for (let i = chart.data.datasets.length - 1; i >= 0; i--) {
    const lineY = interpolateLineY(chart, i, clickX);
    const baseY = i > 0 ? interpolateLineY(chart, i - 1, clickX) : chartBottom;
    if (lineY == null || baseY == null) continue;
    if (clickY < Math.min(lineY, baseY) || clickY > Math.max(lineY, baseY)) continue;

    const groupingDimensionValue = (data?.datasets?.[i] as { rawLabel?: string })?.rawLabel;
    onAreaClicked({
      groupingDimensionValue,
      groupingDimensionTimeRange: getTimeRangeFromDimensionValue({
        value: groupingDimensionValue,
        dimension: groupBy,
      }),
    });
    return;
  }
};

export const createAreaClickHandler =
  ({
    data,
    dimension,
    groupBy,
    granularity,
    onPointClicked,
    onAreaClicked,
  }: {
    data: ChartData<'line'>;
    dimension: Dimension;
    groupBy: Dimension;
    granularity?: Granularity;
    onPointClicked?: (arg: AreaChartProPointClickArg) => void;
    onAreaClicked?: (arg: AreaChartProAreaClickArg) => void;
  }) =>
  (event: ChartEvent, _elements: ActiveElement[], chart: Chart): void => {
    if (
      onPointClicked &&
      handlePointClick(chart, event, data, dimension, granularity, onPointClicked)
    )
      return;
    if (onAreaClicked) handleAreaClick(chart, event, data, groupBy, onAreaClicked);
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
    ...(theme.charts?.areaChartPro?.options || {}),
  });
};
