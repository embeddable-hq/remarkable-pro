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
    if (!onPointClicked && !onAreaClicked) return;

    const clickY = event.y;

    const pointElements = chart.getElementsAtEventForMode(
      event.native as Event,
      'nearest',
      { intersect: true },
      false,
    );

    if (pointElements.length && onPointClicked) {
      const clickedElement = pointElements[0]!;
      const pointY = (
        chart.getDatasetMeta(clickedElement.datasetIndex).data[clickedElement.index] as unknown as {
          y: number;
        }
      ).y;

      const isOnPoint = clickY == null || Math.abs(clickY - pointY) <= 8;

      if (isOnPoint) {
        const dimensionValue = data?.labels?.[clickedElement.index] as string | undefined;
        const measureValue = (
          data?.datasets?.[clickedElement.datasetIndex] as { data?: unknown[] } | undefined
        )?.data?.[clickedElement.index] as number | undefined;

        onPointClicked({
          dimensionValue,
          dimensionTimeRange: getTimeRangeFromDimensionValue({
            value: dimensionValue,
            stateGranularity: granularity,
            dimension,
          }),
          measureValue,
        });
        return;
      }
    }

    if (!onAreaClicked) return;

    const clickX = event.x;
    if (clickX == null || clickY == null) return;

    const chartBottom =
      (chart.chartArea as { bottom: number } | undefined)?.bottom ?? Number.MAX_VALUE;

    const interpolateLineY = (datasetIndex: number): number | null => {
      const points = chart.getDatasetMeta(datasetIndex).data as unknown as {
        x: number;
        y: number;
      }[];
      for (let j = 0; j < points.length - 1; j++) {
        const p1 = points[j]!;
        const p2 = points[j + 1]!;
        if (p1.x <= clickX && p2.x >= clickX) {
          const t = (clickX - p1.x) / (p2.x - p1.x);
          return p1.y + t * (p2.y - p1.y);
        }
      }
      const last = points[points.length - 1];
      return last && last.x === clickX ? last.y : null;
    };

    const numDatasets = chart.data.datasets.length;
    for (let i = numDatasets - 1; i >= 0; i--) {
      const lineY = interpolateLineY(i);
      const baseY = i > 0 ? interpolateLineY(i - 1) : chartBottom;
      if (lineY == null || baseY == null) continue;
      const top = Math.min(lineY, baseY);
      const bottom = Math.max(lineY, baseY);
      if (clickY >= top && clickY <= bottom) {
        const groupingDimensionValue = (data?.datasets?.[i] as { rawLabel?: string } | undefined)
          ?.rawLabel;
        onAreaClicked({
          groupingDimensionValue,
          groupingDimensionTimeRange: getTimeRangeFromDimensionValue({
            value: groupingDimensionValue,
            dimension: groupBy,
          }),
        });
        return;
      }
    }
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
