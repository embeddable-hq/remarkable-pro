import { ChartData } from 'chart.js';
import { CUBE_DIMENSION_TYPE_TIME, DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { getChartColors } from '@embeddable.com/remarkable-ui';
import type { ScatterChartInputPoint } from '@embeddable.com/remarkable-ui';
import { getDimensionMeasureColor } from '../../../../theme/styles/styles.utils';

const NULL_GROUP_KEY = '__scatter_null_group__';

export const measureToNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const getDimensionFieldName = (d: Dimension): string =>
  `${d.name}${d.nativeType === CUBE_DIMENSION_TYPE_TIME && d.inputs?.granularity ? `.${d.inputs.granularity}` : ''}`;

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
    /** Single-series override; when set, all points use this color */
    pointColor?: string;
  },
  theme: Theme,
): ScatterChartProDataResult => {
  const themeFormatter = getThemeFormatter(theme);
  const chartColors = getChartColors();
  const data = props.data ?? [];
  const pointField = getDimensionFieldName(props.pointDimension);
  const xName = props.xMeasure.name;
  const yName = props.yMeasure.name;

  if (!data.length) {
    return {
      chartData: { datasets: [{ label: '', data: [] }] },
      rowIndexByPoint: [[]],
    };
  }

  const buildPoint = (row: Record<string, unknown>): ScatterChartInputPoint => {
    const x = measureToNullableNumber(row[xName]);
    const y = measureToNullableNumber(row[yName]);
    const rawPoint = row[pointField];
    const pointLabel =
      rawPoint === null || rawPoint === undefined
        ? props.noValueLabel
        : String(themeFormatter.data(props.pointDimension, rawPoint as string | number | boolean));

    return {
      x,
      y,
      pointLabel,
      label: pointLabel,
    };
  };

  if (!props.groupByDimension) {
    const points: ScatterChartInputPoint[] = [];
    const rowIndexByPoint: number[][] = [[]];

    data.forEach((row, rowIndex) => {
      points.push(buildPoint(row as Record<string, unknown>));
      rowIndexByPoint[0]!.push(rowIndex);
    });

    const bg = props.pointColor?.trim()
      ? props.pointColor
      : getDimensionMeasureColor({
          dimensionOrMeasure: props.xMeasure,
          theme,
          color: 'background',
          value: props.xMeasure.name,
          index: 0,
          chartColors,
        });

    const border = props.pointColor?.trim()
      ? props.pointColor
      : getDimensionMeasureColor({
          dimensionOrMeasure: props.xMeasure,
          theme,
          color: 'border',
          value: props.xMeasure.name,
          index: 0,
          chartColors,
        });

    return {
      chartData: {
        datasets: [
          {
            label: themeFormatter.dimensionOrMeasureTitle(props.yMeasure),
            data: points,
            pointBackgroundColor: bg,
            pointBorderColor: border,
          },
        ],
      },
      rowIndexByPoint,
    };
  }

  const groupDim = props.groupByDimension;
  const groupField = getDimensionFieldName(groupDim);

  const bucket = new Map<string, { points: ScatterChartInputPoint[]; rowIndices: number[] }>();

  data.forEach((row, rowIndex) => {
    const r = row as Record<string, unknown>;
    const rawG = r[groupField];
    const key = rawG === null || rawG === undefined ? NULL_GROUP_KEY : String(rawG);
    if (!bucket.has(key)) {
      bucket.set(key, { points: [], rowIndices: [] });
    }
    const b = bucket.get(key)!;
    b.points.push(buildPoint(r));
    b.rowIndices.push(rowIndex);
  });

  const sortedKeys = [...bucket.keys()].sort((a, b) => {
    if (a === NULL_GROUP_KEY) return 1;
    if (b === NULL_GROUP_KEY) return -1;
    return a.localeCompare(b);
  });

  const datasets = sortedKeys.map((key, index) => {
    const { points, rowIndices } = bucket.get(key)!;
    const firstRow = data[rowIndices[0]!] as Record<string, unknown>;
    const rawG = key === NULL_GROUP_KEY ? null : firstRow[groupField];

    const seriesLabel =
      key === NULL_GROUP_KEY
        ? props.noValueLabel
        : themeFormatter.data(groupDim, rawG as string | number | boolean);

    const colorKey = key === NULL_GROUP_KEY ? `${groupDim.name}.null` : `${groupDim.name}.${key}`;

    const bg = getDimensionMeasureColor({
      dimensionOrMeasure: groupDim,
      theme,
      color: 'background',
      value: colorKey,
      index,
      chartColors,
    });

    const border = getDimensionMeasureColor({
      dimensionOrMeasure: groupDim,
      theme,
      color: 'border',
      value: colorKey,
      index,
      chartColors,
    });

    const manual = props.pointColor?.trim();
    return {
      label: seriesLabel,
      data: points,
      pointBackgroundColor: manual ? manual : bg,
      pointBorderColor: manual ? manual : border,
    };
  });

  const rowIndexByPoint = sortedKeys.map((key) => bucket.get(key)!.rowIndices);

  return {
    chartData: { datasets },
    rowIndexByPoint,
  };
};
