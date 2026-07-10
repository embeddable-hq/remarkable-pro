import {
  DataResponse,
  Dataset,
  LoadDataRequest,
  Measure,
  OrderBy,
  QueryFilter,
  loadData,
} from '@embeddable.com/core';
import { SortDirectionTypeOptions } from '../types/SortDirection.type.emb';

const ADDITIVE_AGG_TYPES = new Set(['sum', 'count']);

export const getMeasureAggType = (measure: Measure): string | undefined =>
  (measure.meta as Record<string, unknown> | undefined)?.aggType as string | undefined;

export const isAdditiveMeasure = (measure: Measure): boolean => {
  const aggType = getMeasureAggType(measure);
  return aggType == null || ADDITIVE_AGG_TYPES.has(aggType);
};

export const getAdditiveMeasures = (measures: Measure[]): Measure[] =>
  measures.filter(isAdditiveMeasure);

export const getTopItemsOrderBy = (measures: Measure[]): OrderBy[] => {
  const [firstMeasure] = measures;
  if (!firstMeasure) return [];
  return [{ property: firstMeasure, direction: SortDirectionTypeOptions.desc }];
};

type OtherTotalLoadDataArgs = {
  dataset: Dataset;
  measures: Measure[];
  timezone?: string;
  filters?: QueryFilter[];
};

export const otherTotalLoadDataArgs = ({
  dataset,
  measures,
  timezone,
  filters,
}: OtherTotalLoadDataArgs): LoadDataRequest | undefined => {
  const additiveMeasures = getAdditiveMeasures(measures);
  if (!additiveMeasures.length) return undefined;

  return {
    from: dataset,
    select: additiveMeasures,
    timezone,
    ...(filters?.length ? { filters } : {}),
  };
};

type LoadOtherTotalArgs = OtherTotalLoadDataArgs & {
  maxItems?: number;
};

export const loadOtherTotal = ({
  dataset,
  measures,
  maxItems,
  timezone,
  filters,
}: LoadOtherTotalArgs): DataResponse | undefined => {
  if (!maxItems) return undefined;
  const args = otherTotalLoadDataArgs({ dataset, measures, timezone, filters });
  if (!args) return undefined;
  return loadData(args);
};

export const isOtherTotalPending = (resultsOtherTotal?: DataResponse): boolean =>
  resultsOtherTotal != null &&
  !resultsOtherTotal.error &&
  (resultsOtherTotal.isLoading || resultsOtherTotal.data == null);

export const getMeasureTotals = (
  otherTotalResults: DataResponse | undefined,
  measures: Measure[],
): Record<string, number> => {
  const row = otherTotalResults?.data?.[0];
  if (!row) return {};

  const totals: Record<string, number> = {};
  for (const measure of getAdditiveMeasures(measures)) {
    const value = Number.parseFloat(row[measure.name]);
    if (Number.isFinite(value)) totals[measure.name] = value;
  }
  return totals;
};
