import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DataResponse, Measure } from '@embeddable.com/core';
import {
  getThemeFormatter,
  type GetThemeFormatter,
} from '../../../theme/formatter/formatter.utils';
import { getKpiResults, getKpiValueFormatter } from './kpis.utils';
import { Theme } from '../../../theme/theme.types';

const measure = { name: 'revenue', nativeType: 'number' } as Measure;

const results: DataResponse = {
  isLoading: false,
  data: [{ revenue: '1000' }],
};

vi.mock('../../../theme/formatter/formatter.utils', () => ({ getThemeFormatter: vi.fn() }));

describe('getKpiValueFormatter', () => {
  const mockThemeFormatter = {
    data: vi.fn((_: Measure, value: number) => `formatted:${value}`),
  } as unknown as GetThemeFormatter;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getThemeFormatter).mockReturnValue(mockThemeFormatter);
  });

  it('returns value.toString() when disableFormattingKpiValue is true', () => {
    const formatter = getKpiValueFormatter({ measure }, {
      disableFormatting: { kpi: { value: true } },
    } as Theme);
    expect(formatter(42)).toBe('42');
    expect(mockThemeFormatter.data).not.toHaveBeenCalled();
  });

  it('calls themeFormatter.data when disableFormattingKpiValue is false', () => {
    const formatter = getKpiValueFormatter({ measure }, {
      disableFormatting: { kpi: { value: false } },
    } as Theme);
    expect(formatter(42)).toBe('formatted:42');
    expect(mockThemeFormatter.data).toHaveBeenCalledWith(measure, 42);
  });

  it('calls themeFormatter.data when disableFormattingKpiValue is undefined', () => {
    const formatter = getKpiValueFormatter({ measure }, {} as Theme);
    expect(formatter(100)).toBe('formatted:100');
    expect(mockThemeFormatter.data).toHaveBeenCalledWith(measure, 100);
  });

  it('passes the correct measure to themeFormatter.data', () => {
    const cost = { name: 'cost', nativeType: 'number' } as Measure;
    const formatter = getKpiValueFormatter({ measure: cost }, {} as Theme);
    formatter(99);
    expect(mockThemeFormatter.data).toHaveBeenCalledWith(cost, 99);
  });
});

describe('getKpiResults', () => {
  it('returns results unchanged when hasDisplayNullAs is false', () => {
    const emptyResults: DataResponse = { data: [], isLoading: false };
    expect(getKpiResults(emptyResults, measure, false)).toBe(emptyResults);
  });

  it('returns results unchanged when hasDisplayNullAs is true and data exists', () => {
    expect(getKpiResults(results, measure, true)).toBe(results);
  });

  it('injects null row when hasDisplayNullAs is true and data is empty', () => {
    const emptyResults: DataResponse = { data: [], isLoading: false };
    expect(getKpiResults(emptyResults, measure, true)).toEqual({
      data: [{ revenue: null }],
      isLoading: false,
    });
  });

  it('injects null row when hasDisplayNullAs is true and data is undefined', () => {
    const noDataResults: DataResponse = { data: undefined, isLoading: false };
    expect(getKpiResults(noDataResults, measure, true)).toEqual({
      data: [{ revenue: null }],
      isLoading: false,
    });
  });

  it('preserves other fields on results when injecting null row', () => {
    const resultsWithExtra = { data: [], isLoading: false, error: 'oops' } as DataResponse;
    const output = getKpiResults(resultsWithExtra, measure, true);
    expect(output).toEqual({ data: [{ revenue: null }], isLoading: false, error: 'oops' });
  });

  it('uses measure.name as the key for the null row', () => {
    const cost = { name: 'cost' } as Measure;
    const output = getKpiResults({ data: [], isLoading: false }, cost, true);
    expect(output.data?.[0]).toHaveProperty('cost', null);
  });
});
