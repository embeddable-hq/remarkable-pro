import { describe, it, expect } from 'vitest';
import type { DataResponse, Measure } from '@embeddable.com/core';
import { getKpiResults } from './kpis.utils';

const measure = { name: 'revenue' } as Measure;

const results: DataResponse = {
  data: [{ revenue: '1000' }],
};

describe('getKpiResults', () => {
  it('returns results unchanged when hasDisplayNullAs is false', () => {
    const emptyResults: DataResponse = { data: [] };
    expect(getKpiResults(emptyResults, measure, false)).toBe(emptyResults);
  });

  it('returns results unchanged when hasDisplayNullAs is true and data exists', () => {
    expect(getKpiResults(results, measure, true)).toBe(results);
  });

  it('injects null row when hasDisplayNullAs is true and data is empty', () => {
    const emptyResults: DataResponse = { data: [] };
    expect(getKpiResults(emptyResults, measure, true)).toEqual({
      data: [{ revenue: null }],
    });
  });

  it('injects null row when hasDisplayNullAs is true and data is undefined', () => {
    const noDataResults: DataResponse = { data: undefined };
    expect(getKpiResults(noDataResults, measure, true)).toEqual({
      data: [{ revenue: null }],
    });
  });

  it('preserves other fields on results when injecting null row', () => {
    const resultsWithExtra = { data: [], isLoading: false, error: 'oops' } as DataResponse;
    const output = getKpiResults(resultsWithExtra, measure, true);
    expect(output).toEqual({ data: [{ revenue: null }], isLoading: false, error: 'oops' });
  });

  it('uses measure.name as the key for the null row', () => {
    const cost = { name: 'cost' } as Measure;
    const output = getKpiResults({ data: [] }, cost, true);
    expect(output.data?.[0]).toHaveProperty('cost', null);
  });
});
