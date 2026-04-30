import type { Measure } from '@embeddable.com/core';

export const measureToNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const getCellValue = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export const NULL_GROUP_KEY = '__scatter_null_group__';

export const buildScatterProScales = (
  xMeasure: Measure,
  yMeasure: Measure,
  formatTick: (measure: Measure, value: number) => string,
) => ({
  x: {
    ticks: {
      callback: (tickValue: string | number) => {
        const v = typeof tickValue === 'number' ? tickValue : Number(tickValue);
        return formatTick(xMeasure, v);
      },
    },
  },
  y: {
    ticks: {
      callback: (tickValue: string | number) => {
        const v = typeof tickValue === 'number' ? tickValue : Number(tickValue);
        return formatTick(yMeasure, v);
      },
    },
  },
});

type SharedDatasetOriginal = {
  label?: string;
  originalData?: { x: number | null; y: number | null }[];
};

export const buildScatterProDatalabelsValue = (
  xMeasure: Measure,
  yMeasure: Measure,
  formatValue: (measure: Measure, value: number | null | undefined) => string,
) => ({
  formatter: (_value: unknown, context: { dataset: unknown; dataIndex: number }) => {
    const ds = context.dataset as SharedDatasetOriginal;
    const raw = ds.originalData?.[context.dataIndex];
    if (!raw) return '';
    return `${formatValue(xMeasure, raw.x)}, ${formatValue(yMeasure, raw.y)}`;
  },
});
