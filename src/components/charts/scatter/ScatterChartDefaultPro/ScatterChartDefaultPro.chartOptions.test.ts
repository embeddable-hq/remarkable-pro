import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DimensionOrMeasure, Measure } from '@embeddable.com/core';
import { getScatterChartProMeasureFormattingProps } from './ScatterChartDefaultPro.chartOptions';
import {
  getThemeFormatter,
  type GetThemeFormatter,
} from '../../../../theme/formatter/formatter.utils';
import type { Theme } from '../../../../theme/theme.types';

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

describe('getScatterChartProMeasureFormattingProps', () => {
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

  it('formats axis ticks with full measure formatting via themeFormatter.data (same as values)', () => {
    const { formatAxisTick, formatMeasureValue } = getScatterChartProMeasureFormattingProps(
      { xMeasure, yMeasure },
      {} as Theme,
    );

    expect(formatAxisTick('x', 1_000_000)).toBe('data:x:1000000');
    expect(vi.mocked(dataFn)).toHaveBeenCalledWith(xMeasure, 1_000_000);

    formatMeasureValue('x', 99, 'NV');
    expect(vi.mocked(dataFn)).toHaveBeenCalledWith(xMeasure, 99);
  });

  it('uses the x measure data formatter for x axis ticks when measure has currency', () => {
    const xUsd = {
      name: 'revenue',
      title: 'Revenue',
      nativeType: 'number',
      inputs: { currency: 'USD' },
    } as unknown as Measure;

    const { formatAxisTick } = getScatterChartProMeasureFormattingProps(
      { xMeasure: xUsd, yMeasure },
      {} as Theme,
    );

    expect(formatAxisTick('x', 25_000)).toBe('data:revenue:25000');
    expect(vi.mocked(dataFn)).toHaveBeenCalledWith(xUsd, 25_000);
  });

  it('uses nullLabel for null measure values in formatMeasureValue', () => {
    const { formatMeasureValue } = getScatterChartProMeasureFormattingProps(
      { xMeasure, yMeasure },
      {} as Theme,
    );
    expect(formatMeasureValue('x', null, 'NV')).toBe('NV');
    expect(formatMeasureValue('y', undefined, 'NV')).toBe('NV');
  });
});
