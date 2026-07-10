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

/**
 * The "Other" bucket in charts groups every item beyond the top-N into a single
 * category. Historically this was derived purely from the rows returned to the
 * front-end, which is wrong when the query hits its row limit (component
 * `maxResults` or a Cube-level cap): the tail is then incomplete and "Other" is
 * understated.
 *
 * These helpers move the additive part of that calculation to the data layer.
 * A second, no-dimension "grand total" query returns the full-dataset total for
 * each additive measure, letting the chart compute `Other = grandTotal - sum(head)`
 * (see `groupTailAsOther`) instead of summing an incomplete tail.
 */

// Only sum/count-style measures are additive across dimension groups, i.e. the
// per-group values add up to the full-dataset total. `undefined` keeps the
// legacy default (treated as a sum). avg/min/max/median are intentionally
// excluded — recovering their "Other" value needs a different (exclude-head)
// query and is left on the existing front-end path.
const ADDITIVE_AGG_TYPES = new Set(['sum', 'count']);

export const getMeasureAggType = (measure: Measure): string | undefined =>
  (measure.meta as Record<string, unknown> | undefined)?.aggType as string | undefined;

export const isAdditiveMeasure = (measure: Measure): boolean => {
  const aggType = getMeasureAggType(measure);
  return aggType == null || ADDITIVE_AGG_TYPES.has(aggType);
};

export const getAdditiveMeasures = (measures: Measure[]): Measure[] =>
  measures.filter(isAdditiveMeasure);

/**
 * Order rows so the top-N (largest first) are deterministic regardless of how
 * the backend happens to return them — required for the head/tail split to be
 * correct once we start relying on the query's ordering.
 */
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

/**
 * Builds the no-dimension "grand total" request for the additive measures.
 * Returns `undefined` when there are no additive measures (nothing to recover).
 */
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
  /** The chart's "max items" input; only load when the Other bucket is active. */
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

/**
 * True when the initial results query returned fewer rows than the full result
 * set — i.e. the front-end tail is incomplete. Prefers the server-reported row
 * count (`total`, from `countRows: true`) and falls back to comparing the
 * returned length against the requested limit.
 */
export const isResultTruncated = (results?: DataResponse, limit?: number): boolean => {
  const length = results?.data?.length ?? 0;
  if (results?.total != null) return results.total > length;
  return limit != null && limit > 0 && length >= limit;
};

/**
 * Extracts full-dataset totals (keyed by measure name) from the single-row
 * grand-total response, for additive measures only. Non-numeric/missing values
 * are skipped so the consumer falls back to the front-end tail for them.
 */
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
