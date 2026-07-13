import { DataResponse, Dataset, Dimension, Measure, OrderBy, loadData } from '@embeddable.com/core';
import { SortDirectionTypeOptions } from '../types/SortDirection.type.emb';
import { groupTailAsOther, MeasureTotals } from './charts.utils';

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

type ChartCardDataArgs = {
  results: DataResponse;
  resultsOtherTotal?: DataResponse;
  dimension: Dimension;
  measures: Measure[];
  maxItems?: number;
};

export const getChartCardData = ({
  results,
  resultsOtherTotal,
  dimension,
  measures,
  maxItems,
}: ChartCardDataArgs): DataResponse => {
  const otherTotalPending =
    resultsOtherTotal != null &&
    !resultsOtherTotal.error &&
    (resultsOtherTotal.isLoading || resultsOtherTotal.data == null);
  if (otherTotalPending) return { ...results, isLoading: true, data: undefined };
  if (!results.data) return results;

  const measureTotals = getMeasureTotals(resultsOtherTotal, measures);
  return {
    ...results,
    data: groupTailAsOther(results.data, dimension, measures, maxItems, measureTotals),
  };
};
