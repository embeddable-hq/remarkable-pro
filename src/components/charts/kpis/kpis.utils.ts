import { DataResponse, Measure } from '@embeddable.com/core';

export const getKpiResults = (
  results: DataResponse,
  measure: Measure,
  hasDisplayNullAs: boolean,
): DataResponse => {
  if (!hasDisplayNullAs) return results;
  const hasNoData = !results.data || results.data.length === 0;
  return hasNoData ? { ...results, data: [{ [measure.name]: null }] } : results;
};
