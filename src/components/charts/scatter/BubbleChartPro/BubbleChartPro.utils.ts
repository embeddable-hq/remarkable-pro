import { BubbleDataPoint, ChartData, type ChartOptions } from 'chart.js';
import { Context } from 'chartjs-plugin-datalabels';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';
import { dispatchEventUserInteraction } from '../../../../utils/events.utils';
import { Theme } from '../../../../theme/theme.types';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getChartColors, getStyleNumber } from '@embeddable.com/remarkable-ui';
import type { ChartClickArgs, BubbleDatasetExtended } from '@embeddable.com/remarkable-ui';
import { getDimensionMeasureColor } from '../../../../theme/styles/styles.utils';
import type { BubbleChartProOptionsClickArg, BubblePoint } from './BubbleChartPro.types';
import { getDimensionFieldName } from '../../../../utils/data.utils';
import {
  measureToNullableNumber,
  rawValueToString,
  NULL_GROUP_KEY,
  getScatterScales,
  type RawValue,
} from '../scatter.utils';

export const getBubbleChartProOptions = (
  {
    xMeasure,
    yMeasure,
    sizeMeasure,
    noValueLabel,
    bubbleRadiusMax,
    showPointLabels,
  }: {
    xMeasure: Measure;
    yMeasure: Measure;
    sizeMeasure: Measure;
    noValueLabel: string;
    bubbleRadiusMax?: number;
    showPointLabels?: boolean;
  },
  theme: Theme,
): Partial<ChartOptions<'bubble'>> => {
  const themeFormatter = getThemeFormatter(theme);

  const formatValue = (measure: Measure, value: number | null | undefined): string => {
    if (value === null || value === undefined) return noValueLabel;
    return themeFormatter.data(measure, value);
  };

  const radiusMax = bubbleRadiusMax ?? 20;
  const labelGap = getStyleNumber('--em-scatterchart-label-stack-gap', '0.25rem');
  const labelLineHeight = getStyleNumber('--em-scatterchart-label-stack-height', '1.25rem');

  const getBubbleRadius = (context: Context): number => {
    const ds = context.dataset as BubbleDatasetExtended;
    return ds.bubbleSizes[context.dataIndex] ?? radiusMax;
  };

  const captionOffset = (context: Context): number => getBubbleRadius(context) + labelGap;

  const valueOffset = (context: Context): number => {
    const r = getBubbleRadius(context);
    if (showPointLabels) return r + labelGap + labelLineHeight + labelGap;
    return r + labelGap;
  };

  return {
    scales: getScatterScales(xMeasure, yMeasure, (measure: Measure, value: number) =>
      themeFormatter.data(measure, value),
    ),
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const ds = ctx.dataset as BubbleDatasetExtended;
            const orig = ds.originalData?.[ctx.dataIndex];
            if (!orig) return '';
            return [
              `${themeFormatter.dimensionOrMeasureTitle(xMeasure)}: ${formatValue(xMeasure, orig.x)}`,
              `${themeFormatter.dimensionOrMeasureTitle(yMeasure)}: ${formatValue(yMeasure, orig.y)}`,
              `${themeFormatter.dimensionOrMeasureTitle(sizeMeasure)}: ${formatValue(sizeMeasure, orig.size)}`,
            ];
          },
        },
      },
      datalabels: {
        labels: {
          value: {
            formatter: (_value: BubbleDataPoint, context: Context) => {
              const ds = context.dataset as BubbleDatasetExtended;
              const orig = ds.originalData?.[context.dataIndex];
              if (!orig) return '';
              return formatValue(sizeMeasure, orig.size);
            },
            anchor: 'center',
            align: 'bottom',
            offset: valueOffset,
          },
          caption: {
            anchor: 'center',
            align: 'bottom',
            offset: captionOffset,
          },
        },
      },
    },
  };
};

export const getBubblePointClickData = (
  point: { datasetIndex: number; index: number },
  datasets: ChartData<'bubble', BubblePoint[]>['datasets'],
  data: DataResponse['data'],
  xMeasure: Measure,
  yMeasure: Measure,
  sizeMeasure: Measure,
  pointDimension: Dimension,
  groupByDimension?: Dimension,
): BubbleChartProOptionsClickArg | null => {
  const rowIdx = datasets[point.datasetIndex]?.data[point.index]?.rowIndex;
  if (rowIdx === undefined) return null;
  const row = data?.[rowIdx] as Record<string, RawValue> | undefined;
  if (!row) return null;

  const pointField = getDimensionFieldName(pointDimension);
  const groupField = groupByDimension ? getDimensionFieldName(groupByDimension) : undefined;

  let pointDimensionValue: string | undefined = rawValueToString(row[pointField]);
  let groupByDimensionValue: string | null | undefined = groupField
    ? rawValueToString(row[groupField])
    : null;

  const pointDimensionTimeRange = getTimeRangeFromDimensionValue({
    value: pointDimensionValue,
    dimension: pointDimension,
  });
  const groupByDimensionTimeRange = getTimeRangeFromDimensionValue({
    value: groupByDimensionValue ?? undefined,
    dimension: groupByDimension,
  });

  if (pointDimensionTimeRange) {
    pointDimensionValue = undefined;
  }
  if (groupByDimensionTimeRange) {
    groupByDimensionValue = undefined;
  }

  return {
    xMeasureValue: rawValueToString(row[xMeasure.name]),
    yMeasureValue: rawValueToString(row[yMeasure.name]),
    sizeMeasureValue: rawValueToString(row[sizeMeasure.name]),
    pointDimensionValue,
    groupByDimensionValue,
    pointDimensionTimeRange,
    groupByDimensionTimeRange,
  };
};

export const createBubbleClickHandler = ({
  datasets,
  results,
  xMeasure,
  yMeasure,
  sizeMeasure,
  pointDimension,
  groupByDimension,
  componentName,
  trackingId,
  onPointClick,
}: {
  datasets: ChartData<'bubble', BubblePoint[]>['datasets'];
  results: DataResponse;
  xMeasure: Measure;
  yMeasure: Measure;
  sizeMeasure: Measure;
  pointDimension: Dimension;
  groupByDimension?: Dimension;
  componentName?: string;
  trackingId?: string;
  onPointClick?: (payload: BubbleChartProOptionsClickArg) => void;
}): ((args: ChartClickArgs) => void) => {
  return ({ elementAtEvent }) => {
    const element = elementAtEvent[0];
    if (!element) return;
    const clickData = getBubblePointClickData(
      element,
      datasets,
      results.data,
      xMeasure,
      yMeasure,
      sizeMeasure,
      pointDimension,
      groupByDimension,
    );
    if (!clickData) return;

    dispatchEventUserInteraction({
      componentName,
      trackingId,
      pointDimension,
      groupByDimension,
      xMeasure,
      yMeasure,
      sizeMeasure,
      ...clickData,
    });

    onPointClick?.(clickData);
  };
};

export const getBubbleChartProData = (
  props: {
    data: DataResponse['data'];
    xMeasure: Measure;
    yMeasure: Measure;
    sizeMeasure: Measure;
    pointDimension: Dimension;
    groupByDimension?: Dimension | null;
    noValueLabel: string;
    pointColor?: string;
  },
  theme: Theme,
): ChartData<'bubble', BubblePoint[]> => {
  const themeFormatter = getThemeFormatter(theme);
  const chartColors = getChartColors();
  const data = (props.data ?? []) as Record<string, unknown>[];
  const pointField = getDimensionFieldName(props.pointDimension);
  const overrideColor = props.groupByDimension ? undefined : props.pointColor?.trim() || undefined;

  if (!data.length) {
    return { datasets: [{ label: '', data: [] }] };
  }

  const getColor = (
    color: 'background' | 'border',
    dimensionOrMeasure: Dimension | Measure,
    value: string,
    index: number,
  ) =>
    overrideColor ??
    getDimensionMeasureColor({ dimensionOrMeasure, theme, color, value, index, chartColors });

  const buildPoint = (row: Record<string, unknown>, rowIndex: number): BubblePoint => {
    const rawPoint = row[pointField];
    const pointLabel =
      rawPoint == null
        ? props.noValueLabel
        : String(themeFormatter.data(props.pointDimension, rawPoint as string | number | boolean));
    return {
      x: measureToNullableNumber(row[props.xMeasure.name]),
      y: measureToNullableNumber(row[props.yMeasure.name]),
      size: measureToNullableNumber(row[props.sizeMeasure.name]),
      pointLabel,
      label: pointLabel,
      rowIndex,
    };
  };

  if (!props.groupByDimension) {
    return {
      datasets: [
        {
          label: themeFormatter.dimensionOrMeasureTitle(props.yMeasure),
          data: data.map((row, i) => buildPoint(row, i)),
          backgroundColor: getColor('background', props.xMeasure, props.xMeasure.name, 0),
          borderColor: getColor('border', props.xMeasure, props.xMeasure.name, 0),
        },
      ],
    };
  }

  const groupDim = props.groupByDimension;
  const groupField = getDimensionFieldName(groupDim);
  const bucket = new Map<string, BubblePoint[]>();

  data.forEach((row, rowIndex) => {
    const key = row[groupField] == null ? NULL_GROUP_KEY : String(row[groupField]);
    const points = bucket.get(key) ?? [];
    points.push(buildPoint(row, rowIndex));
    bucket.set(key, points);
  });

  const sortedKeys = [...bucket.keys()].sort((a, b) => {
    if (a === NULL_GROUP_KEY) return 1;
    if (b === NULL_GROUP_KEY) return -1;
    return a.localeCompare(b);
  });

  const datasets = sortedKeys.map((key, index) => {
    const points = bucket.get(key)!;
    const firstRowIndex = points[0]!.rowIndex;
    const groupValue = key === NULL_GROUP_KEY ? null : data[firstRowIndex]?.[groupField];
    const seriesLabel =
      key === NULL_GROUP_KEY
        ? props.noValueLabel
        : themeFormatter.data(groupDim, groupValue as string | number | boolean);
    const colorKey = key === NULL_GROUP_KEY ? `${groupDim.name}.null` : `${groupDim.name}.${key}`;

    return {
      label: seriesLabel,
      data: points,
      backgroundColor: getColor('background', groupDim, colorKey, index),
      borderColor: getColor('border', groupDim, colorKey, index),
    };
  });

  return { datasets };
};
