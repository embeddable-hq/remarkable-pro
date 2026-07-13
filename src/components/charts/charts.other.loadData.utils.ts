import { DataResponse, Dataset, Measure, OrderBy, loadData } from '@embeddable.com/core';
import { SortDirectionTypeOptions } from '../types/SortDirection.type.emb';
import { MeasureTotals } from './charts.utils';

const ADDITIVE_AGG_TYPES = new Set(['sum', 'count']);

export const getAdditiveMeasures = (measures: Measure[]): Measure[] =>
  measures.filter((measure) => {
    const aggType = (measure.meta as { aggType?: string } | undefined)?.aggType;
    return aggType == null || ADDITIVE_AGG_TYPES.has(aggType);
  });

export const getFirstMeasureOrderBy = (measures: Measure[]): OrderBy[] => {
  const [firstMeasure] = measures;
  if (!firstMeasure) return [];
  return [{ property: firstMeasure, direction: SortDirectionTypeOptions.desc }];
};

type LoadDataOtherTotalArgs = {
  dataset: Dataset;
  measures: Measure[];
  maxItems?: number;
  timezone?: string;
};

export const loadDataOtherTotal = ({
  dataset,
  measures,
  maxItems,
  timezone,
}: LoadDataOtherTotalArgs): DataResponse | undefined => {
  if (!maxItems) return undefined;
  const additiveMeasures = getAdditiveMeasures(measures);
  if (!additiveMeasures.length) return undefined;
  return loadData({ from: dataset, select: additiveMeasures, timezone });
};

export const getMeasureTotals = (
  otherTotalResults: DataResponse | undefined,
  measures: Measure[],
): MeasureTotals => {
  const row = otherTotalResults?.data?.[0];
  if (!row) return {};

  const totals: MeasureTotals = {};
  for (const measure of getAdditiveMeasures(measures)) {
    const value = Number.parseFloat(row[measure.name]);
    if (Number.isFinite(value)) totals[measure.name] = value;
  }
  return totals;
};

export const getResultsForCard = (
  results: DataResponse,
  otherTotalResults?: DataResponse,
): DataResponse => {
  const otherTotalPending =
    otherTotalResults != null &&
    !otherTotalResults.error &&
    (otherTotalResults.isLoading || otherTotalResults.data == null);
  return otherTotalPending ? { ...results, isLoading: true, data: undefined } : results;
};
