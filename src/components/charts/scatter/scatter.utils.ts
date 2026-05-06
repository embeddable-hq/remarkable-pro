import type { Measure } from '@embeddable.com/core';

export const measureToNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export type RawValue = string | number | boolean | null | undefined;

export const rawValueToString = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export const NULL_GROUP_KEY = '__scatter_null_group__';

export const buildScatterScales = (
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
