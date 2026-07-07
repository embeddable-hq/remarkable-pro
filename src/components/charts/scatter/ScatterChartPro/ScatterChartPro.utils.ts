import { ChartData, type ChartOptions, ScatterDataPoint } from 'chart.js';
import { Context } from 'chartjs-plugin-datalabels';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { getTimeRangeFromDimensionValue } from '../../../utils/dimension.utils';
import { Theme } from '../../../../theme/theme.types';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getChartColors, getStyleNumber } from '@embeddable.com/remarkable-ui';
import type {
  ChartClickArgs,
  ScatterChartInputPoint,
  ScatterDatasetExtended,
} from '@embeddable.com/remarkable-ui';
import { getDimensionMeasureColor } from '../../../../theme/styles/styles.utils';
import type { ScatterChartProOptionsClickArg } from './ScatterChartPro.types';
import { getDimensionFieldName } from '../../../../utils/data.utils';
import {
  measureToNullableNumber,
  rawValueToString,
  NULL_GROUP_KEY,
  getScatterScales,
  type RawValue,
} from '../scatter.utils';

const buildDatalabelsValue = (
  xMeasure: Measure,
  yMeasure: Measure,
  formatValue: (measure: Measure, value: number | null | undefined) => string,
) => ({
  formatter: (_value: ScatterDataPoint | number | null, context: Context) => {
    const ds = context.dataset as ScatterDatasetExtended;
    const raw = ds.originalData?.[context.dataIndex];
    if (!raw) return '';
    return `${formatValue(xMeasure, raw.x)}, ${formatValue(yMeasure, raw.y)}`;
  },
});

export const getScatterChartProOptions = (
  {
    xMeasure,
    yMeasure,
    noValueLabel,
    showPointLabels,
  }: {
    xMeasure: Measure;
    yMeasure: Measure;
    noValueLabel: string;
    showPointLabels?: boolean;
  },
  theme: Theme,
): Partial<ChartOptions<'scatter'>> => {
  const themeFormatter = getThemeFormatter(theme);

  const formatValue = (measure: Measure, value: number | null | undefined): string => {
    if (value === null || value === undefined) return noValueLabel;
    return themeFormatter.data(measure, value);
  };

  const pointRadius = getStyleNumber('--em-scatterchart-point-radius', '0.375rem');
  const labelGap = getStyleNumber('--em-scatterchart-label-stack-gap', '0.25rem');
  const labelLineHeight = getStyleNumber('--em-scatterchart-label-stack-height', '1.25rem');

  const captionOffset = pointRadius + labelGap;
  const valueOffset = showPointLabels
    ? pointRadius + labelGap + labelLineHeight + labelGap
    : pointRadius + labelGap;

  return {
    scales: getScatterScales(xMeasure, yMeasure, (measure: Measure, value: number) =>
      themeFormatter.data(measure, value),
    ),
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const ds = ctx.dataset as ScatterDatasetExtended;
            const orig =
              ds.originalData?.[ctx.dataIndex] ??
              (ctx.dataset.data[ctx.dataIndex] as
                { x: number | null; y: number | null } | undefined);
            const prefix = ds.label ? `${ds.label}: ` : '';
            if (!orig) return prefix;
            return `${prefix}(${formatValue(xMeasure, orig.x)}, ${formatValue(yMeasure, orig.y)})`;
          },
        },
      },
      datalabels: {
        labels: {
          value: {
            display: 'auto',
            ...buildDatalabelsValue(xMeasure, yMeasure, formatValue),
            anchor: 'center',
            align: 'bottom',
            offset: valueOffset,
          },
          caption: {
            display: 'auto',
            anchor: 'center',
            align: 'bottom',
            offset: captionOffset,
          },
        },
      },
    },
  };
};

export type ScatterPoint = ScatterChartInputPoint & { rowIndex: number };

export const getPointClickData = (
  point: { datasetIndex: number; index: number },
  datasets: ChartData<'scatter', ScatterPoint[]>['datasets'],
  data: DataResponse['data'],
  xMeasure: Measure,
  yMeasure: Measure,
  pointDimension: Dimension,
  groupByDimension?: Dimension,
): ScatterChartProOptionsClickArg | null => {
  const rowIdx = datasets[point.datasetIndex]?.data[point.index]?.rowIndex;
  if (rowIdx === undefined) return null;
  const row = data?.[rowIdx] as Record<string, RawValue> | undefined;
  if (!row) return null;

  const pointField = getDimensionFieldName(pointDimension);
  const groupField = groupByDimension ? getDimensionFieldName(groupByDimension) : undefined;

  const pointDimensionValue = rawValueToString(row[pointField]);
  const groupByDimensionValue = groupField ? rawValueToString(row[groupField]) : null;

  return {
    xMeasureValue: rawValueToString(row[xMeasure.name]),
    yMeasureValue: rawValueToString(row[yMeasure.name]),
    pointDimensionValue,
    groupByDimensionValue,
    pointDimensionTimeRange: getTimeRangeFromDimensionValue({
      value: pointDimensionValue,
      dimension: pointDimension,
    }),
    groupByDimensionTimeRange: getTimeRangeFromDimensionValue({
      value: groupByDimensionValue ?? undefined,
      dimension: groupByDimension,
    }),
  };
};

export const createScatterClickHandler = ({
  datasets,
  results,
  xMeasure,
  yMeasure,
  pointDimension,
  groupByDimension,
  onPointClick,
}: {
  datasets: ChartData<'scatter', ScatterPoint[]>['datasets'];
  results: DataResponse;
  xMeasure: Measure;
  yMeasure: Measure;
  pointDimension: Dimension;
  groupByDimension?: Dimension;
  onPointClick?: (payload: ScatterChartProOptionsClickArg) => void;
}): ((args: ChartClickArgs) => void) => {
  return ({ elementAtEvent }) => {
    const element = elementAtEvent[0];
    if (!element) return;
    const clickData = getPointClickData(
      element,
      datasets,
      results.data,
      xMeasure,
      yMeasure,
      pointDimension,
      groupByDimension,
    );
    if (clickData) onPointClick?.(clickData);
  };
};

export const getScatterChartProData = (
  props: {
    data: DataResponse['data'];
    xMeasure: Measure;
    yMeasure: Measure;
    pointDimension: Dimension;
    groupByDimension?: Dimension | null;
    noValueLabel: string;
    pointColor?: string;
  },
  theme: Theme,
): ChartData<'scatter', ScatterPoint[]> => {
  const themeFormatter = getThemeFormatter(theme);
  const chartColors = getChartColors();
  const data = (props.data ?? []) as Record<string, unknown>[];
  const pointField = getDimensionFieldName(props.pointDimension);
  const overrideColor = props.pointColor?.trim() || undefined;

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

  const buildPoint = (row: Record<string, unknown>, rowIndex: number): ScatterPoint => {
    const rawPoint = row[pointField];
    const pointLabel =
      rawPoint == null
        ? props.noValueLabel
        : String(themeFormatter.data(props.pointDimension, rawPoint as string | number | boolean));
    return {
      x: measureToNullableNumber(row[props.xMeasure.name]),
      y: measureToNullableNumber(row[props.yMeasure.name]),
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
          pointBackgroundColor: getColor('background', props.xMeasure, props.xMeasure.name, 0),
          pointBorderColor: getColor('border', props.xMeasure, props.xMeasure.name, 0),
        },
      ],
    };
  }

  const groupDim = props.groupByDimension;
  const groupField = getDimensionFieldName(groupDim);
  const bucket = new Map<string, ScatterPoint[]>();

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
      pointBackgroundColor: getColor('background', groupDim, colorKey, index),
      pointBorderColor: getColor('border', groupDim, colorKey, index),
    };
  });

  return { datasets };
};
