import { ChartData } from 'chart.js';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getChartColors } from '@embeddable.com/remarkable-ui';
import type { ChartPointClicked, ScatterChartInputPoint } from '@embeddable.com/remarkable-ui';
import { getDimensionMeasureColor } from '../../../../theme/styles/styles.utils';
import { getDimensionFieldName } from '../../../../utils/data.utils';
import type { PointClickArgs } from '../../charts.types';

export { getDimensionFieldName };

export type CellValue = string | number | boolean | null | undefined;

export const serializeCellValue = (value: CellValue): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export const getPointClickData = (
  point: ChartPointClicked,
  rowIndexByPoint: number[][],
  data: DataResponse['data'],
  xMeasure: Measure,
  yMeasure: Measure,
  pointDimension: Dimension,
  groupByDimension?: Dimension,
): PointClickArgs | null => {
  const rowIdx = rowIndexByPoint[point.datasetIndex]?.[point.index];
  if (rowIdx === undefined) return null;
  const row = data?.[rowIdx] as Record<string, CellValue> | undefined;
  if (!row) return null;

  const pointField = getDimensionFieldName(pointDimension);
  const groupField = groupByDimension ? getDimensionFieldName(groupByDimension) : undefined;

  return {
    xMeasureValue: serializeCellValue(row[xMeasure.name]),
    yMeasureValue: serializeCellValue(row[yMeasure.name]),
    pointDimensionValue: serializeCellValue(row[pointField]),
    groupByDimensionValue: groupField ? serializeCellValue(row[groupField]) : null,
  };
};

const NULL_GROUP_KEY = '__scatter_null_group__';

export const measureToNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export type ScatterChartProDataResult = {
  chartData: ChartData<'scatter', ScatterChartInputPoint[]>;
  /** Maps [datasetIndex][pointIndex] → row index in `data` for click handling */
  rowIndexByPoint: number[][];
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
): ScatterChartProDataResult => {
  const themeFormatter = getThemeFormatter(theme);
  const chartColors = getChartColors();
  const data = (props.data ?? []) as Record<string, unknown>[];
  const pointField = getDimensionFieldName(props.pointDimension);
  const overrideColor = props.pointColor?.trim();

  if (!data.length) {
    return { chartData: { datasets: [{ label: '', data: [] }] }, rowIndexByPoint: [[]] };
  }

  const getColor = (
    color: 'background' | 'border',
    dimensionOrMeasure: Dimension | Measure,
    value: string,
    index: number,
  ) =>
    overrideColor ??
    getDimensionMeasureColor({ dimensionOrMeasure, theme, color, value, index, chartColors });

  const buildPoint = (row: Record<string, unknown>): ScatterChartInputPoint => {
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
    };
  };

  if (!props.groupByDimension) {
    return {
      chartData: {
        datasets: [
          {
            label: themeFormatter.dimensionOrMeasureTitle(props.yMeasure),
            data: data.map(buildPoint),
            pointBackgroundColor: getColor('background', props.xMeasure, props.xMeasure.name, 0),
            pointBorderColor: getColor('border', props.xMeasure, props.xMeasure.name, 0),
          },
        ],
      },
      rowIndexByPoint: [data.map((_, i) => i)],
    };
  }

  const groupDim = props.groupByDimension;
  const groupField = getDimensionFieldName(groupDim);
  const bucket = new Map<string, { points: ScatterChartInputPoint[]; rowIndices: number[] }>();

  data.forEach((row, rowIndex) => {
    const key = row[groupField] == null ? NULL_GROUP_KEY : String(row[groupField]);
    const group = bucket.get(key) ?? { points: [], rowIndices: [] };
    group.points.push(buildPoint(row));
    group.rowIndices.push(rowIndex);
    bucket.set(key, group);
  });

  const sortedKeys = [...bucket.keys()].sort((a, b) => {
    if (a === NULL_GROUP_KEY) return 1;
    if (b === NULL_GROUP_KEY) return -1;
    return a.localeCompare(b);
  });

  const datasets = sortedKeys.map((key, index) => {
    const { points, rowIndices } = bucket.get(key)!;
    const groupValue = key === NULL_GROUP_KEY ? null : data[rowIndices[0]!]?.[groupField];
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

  return {
    chartData: { datasets },
    rowIndexByPoint: sortedKeys.map((key) => bucket.get(key)!.rowIndices),
  };
};
