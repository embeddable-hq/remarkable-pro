import { DataResponse, Measure } from '@embeddable.com/core';

export const getKpiResults = (
  results: DataResponse,
  measure: Measure,
  hasDisplayNullAs: boolean,
): DataResponse => {
  if (hasDisplayNullAs) {
    // If no results and hasDisplayNullAs, we want to display null value instead of showing empty chart
    results.data = results.data?.length === 0 ? [{ [measure.name]: null }] : results.data;
  }
  return results;
};
