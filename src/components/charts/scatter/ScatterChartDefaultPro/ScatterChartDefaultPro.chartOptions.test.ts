import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DimensionOrMeasure, Measure } from '@embeddable.com/core';
import { getScatterChartProOptions } from './ScatterChartDefaultPro.chartOptions';
import {
  getThemeFormatter,
  type GetThemeFormatter,
} from '../../../../theme/formatter/formatter.utils';
import type { Theme } from '../../../../theme/theme.types';
import type { TooltipItem } from 'chart.js';
import type { ScatterDatasetWithOriginal } from '@embeddable.com/remarkable-ui';

vi.mock('../../../../theme/formatter/formatter.utils', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../../theme/formatter/formatter.utils')>();
  return {
    ...actual,
    getThemeFormatter: vi.fn(),
  };
});

const xMeasure = { name: 'x', title: 'X', nativeType: 'number', inputs: {} } as unknown as Measure;
const yMeasure = { name: 'y', title: 'Y', nativeType: 'number', inputs: {} } as unknown as Measure;
const NO_VALUE = 'No value';

describe('getScatterChartProOptions', () => {
  let dataFn: GetThemeFormatter['data'];

  beforeEach(() => {
    dataFn = vi.fn(
      (m: DimensionOrMeasure, value: unknown) => `data:${m.name}:${value}`,
    ) as GetThemeFormatter['data'];

    const formatter: GetThemeFormatter = {
      string: (key) => key,
      number: (v) => String(v),
      dateTime: (d) => d.toISOString(),
      dimensionOrMeasureTitle: (key) => key.title ?? key.name,
      data: dataFn,
    };
    vi.mocked(getThemeFormatter).mockReturnValue(formatter);
  });

  describe('tick callbacks', () => {
    it('formats x axis ticks using themeFormatter.data with xMeasure', () => {
      const opts = getScatterChartProOptions({ xMeasure, yMeasure }, {} as Theme, NO_VALUE);
      const xCb = opts.scales?.x?.ticks?.callback as (v: string | number) => string;

      expect(xCb(1_000_000)).toBe('data:x:1000000');
      expect(vi.mocked(dataFn)).toHaveBeenCalledWith(xMeasure, 1_000_000);
    });

    it('formats y axis ticks using themeFormatter.data with yMeasure', () => {
      const opts = getScatterChartProOptions({ xMeasure, yMeasure }, {} as Theme, NO_VALUE);
      const yCb = opts.scales?.y?.ticks?.callback as (v: string | number) => string;

      expect(yCb(2)).toBe('data:y:2');
      expect(vi.mocked(dataFn)).toHaveBeenCalledWith(yMeasure, 2);
    });

    it('uses the measure formatter for currency measures', () => {
      const xUsd = {
        name: 'revenue',
        title: 'Revenue',
        nativeType: 'number',
        inputs: { currency: 'USD' },
      } as unknown as Measure;

      const opts = getScatterChartProOptions({ xMeasure: xUsd, yMeasure }, {} as Theme, NO_VALUE);
      const xCb = opts.scales?.x?.ticks?.callback as (v: string | number) => string;

      expect(xCb(25_000)).toBe('data:revenue:25000');
      expect(vi.mocked(dataFn)).toHaveBeenCalledWith(xUsd, 25_000);
    });
  });

  describe('tooltip label', () => {
    it('formats tooltip using originalData when available', () => {
      const opts = getScatterChartProOptions({ xMeasure, yMeasure }, {} as Theme, NO_VALUE);
      const labelFn = opts.plugins?.tooltip?.callbacks?.label as (
        ctx: TooltipItem<'scatter'>,
      ) => string;

      const ctx = {
        dataset: {
          label: 'Series A',
          originalData: [{ x: 10, y: 20 }],
          data: [],
        } as unknown as ScatterDatasetWithOriginal,
        dataIndex: 0,
        parsed: { x: 10, y: 20 },
      } as unknown as TooltipItem<'scatter'>;

      expect(labelFn(ctx)).toBe('Series A: (data:x:10, data:y:20)');
    });

    it('returns noValueLabel for null measure values in tooltip', () => {
      const opts = getScatterChartProOptions({ xMeasure, yMeasure }, {} as Theme, NO_VALUE);
      const labelFn = opts.plugins?.tooltip?.callbacks?.label as (
        ctx: TooltipItem<'scatter'>,
      ) => string;

      const ctx = {
        dataset: {
          label: '',
          originalData: [{ x: null, y: null }],
          data: [],
        } as unknown as ScatterDatasetWithOriginal,
        dataIndex: 0,
        parsed: { x: 0, y: 0 },
      } as unknown as TooltipItem<'scatter'>;

      expect(labelFn(ctx)).toBe(`(${NO_VALUE}, ${NO_VALUE})`);
    });
  });
});
