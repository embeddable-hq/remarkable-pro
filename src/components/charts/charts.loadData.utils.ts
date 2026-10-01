import {
  DataResponse,
  Dataset,
  Dimension,
  Granularity,
  loadData,
  LoadDataRequest,
  Measure,
  OrderDirection,
} from '@embeddable.com/core';
import { getDimensionWithGranularity } from './utils/granularity.utils';
import { getSortDirectionValue, SortDirectionTypeOptions } from '../types/SortDirection.type.emb';
import { isOtherBucketableMeasure } from './charts.utils';

export const getLimit = (limit?: number): number | undefined =>
  typeof limit === 'number' && Number.isInteger(limit) && limit > 0 ? limit : undefined;

export const shouldGetTopItems = (sortDirection?: OrderDirection, limit?: number): boolean =>
  Boolean(getSortDirectionValue(sortDirection) || getLimit(limit));

const EMPTY_RESULTS = { data: [], isLoading: false } as DataResponse;

// ---- Axis Order ----

type LoadDataResultsAxisOrderArgs = {
  dataset: Dataset;
  axis: Dimension;
  measure: Measure;
  sortDirection?: OrderDirection;
  limit?: number;
  timezone?: string;
};

export const loadDataResultsAxisOrderArgs = ({
  dataset,
  axis,
  measure,
  sortDirection,
  limit,
  timezone,
}: LoadDataResultsAxisOrderArgs): LoadDataRequest => {
  return {
    from: dataset,
    select: [axis, measure],
    orderBy: [
      {
        property: measure,
        direction: getSortDirectionValue(sortDirection) ?? SortDirectionTypeOptions.desc,
      },
    ],
    limit: getLimit(limit),
    timezone,
  };
};

type LoadDataResultsAxisOrder = {
  dataset: Dataset;
  axis: Dimension;
  measure: Measure;
  limitTopAxis?: number;
  sortDirection?: OrderDirection;
  timezone?: string;
};

export const loadDataResultsAxisOrder = ({
  dataset,
  axis,
  measure,
  limitTopAxis,
  sortDirection,
  timezone,
}: LoadDataResultsAxisOrder): DataResponse | undefined => {
  const needsTopItems = shouldGetTopItems(sortDirection, limitTopAxis);

  if (!needsTopItems) return undefined;

  return loadData(
    loadDataResultsAxisOrderArgs({
      dataset,
      axis,
      measure,
      sortDirection,
      limit: limitTopAxis,
      timezone,
    }),
  );
};

export const getAxisOrderCacheKey = ({
  dataset,
  axis,
  measure,
  sortDirection,
  limit,
  timezone,
}: LoadDataResultsAxisOrderArgs): string | undefined => {
  if (!shouldGetTopItems(sortDirection, limit)) return undefined;
  return JSON.stringify(
    loadDataResultsAxisOrderArgs({ dataset, axis, measure, sortDirection, limit, timezone }),
  );
};

export const getCachedAxisOrder = (
  axisOrderCacheKey: string | undefined,
  state: { axisOrderCacheKey?: string; axisOrder?: string[] } | undefined,
): string[] | undefined => {
  if (axisOrderCacheKey == null || axisOrderCacheKey !== state?.axisOrderCacheKey) return undefined;
  return state?.axisOrder;
};

// ---- Group Order (Y-axis "Other" bucketing) ----
//
// Ranks the groupBy dimension (the one driving side-by-side bars / stack
// segments / separate lines) by its total contribution to the measure across
// the whole axis range, independent of any axis-order limiting above. Only
// applies to sum/count measures — avg/min/max can't be correctly represented
// by a NOT-IN "everything else" aggregate (see isOtherBucketableMeasure).

export const getGroupOrderLimit = (limitTopGroupBy?: number): number | undefined => {
  const limit = getLimit(limitTopGroupBy);
  // A limit of 1 leaves no room for a real group next to "Other", so group
  // bucketing is disabled entirely.
  if (limit == null || limit < 2) return undefined;
  // Fetch one more than the limit so resolveGroupOrder can tell whether the
  // groups actually overflow it — see resolveGroupOrder.
  return limit + 1;
};

// Turns the ranked group order (fetched with getGroupOrderLimit's limit + 1)
// into the groups to keep, and whether an "Other" bucket is needed. Matches
// groupTailAsOther's maxItems semantics: if every group fits within the limit
// they're all kept and there is no "Other"; only when there are more groups
// than the limit are the top limit - 1 kept, with the rest bucketed into
// "Other". Without this, "Other" was always shown — as an all-zero series
// when nothing was left to bucket.
export const resolveGroupOrder = (
  groupOrder: string[] | undefined,
  limitTopGroupBy?: number,
): { keptGroups: string[] | undefined; hasOtherGroup: boolean } => {
  const limit = getLimit(limitTopGroupBy);
  if (groupOrder == null || limit == null || groupOrder.length <= limit) {
    return { keptGroups: groupOrder, hasOtherGroup: false };
  }
  return { keptGroups: groupOrder.slice(0, limit - 1), hasOtherGroup: true };
};

export const shouldGetTopGroupItems = (measure: Measure, limitTopGroupBy?: number): boolean =>
  isOtherBucketableMeasure(measure) && (getGroupOrderLimit(limitTopGroupBy) ?? 0) > 0;

type LoadDataResultsGroupOrderArgs = {
  dataset: Dataset;
  groupBy: Dimension;
  measure: Measure;
  sortDirection?: OrderDirection;
  limit?: number;
  timezone?: string;
};

// Deliberately no axis filter here, even when axis top-N (limitTopXAxis) is
// also configured: groups are ranked by their total across the WHOLE axis
// range, not just the axis buckets that end up displayed. That means a
// group ranked "top" here can look small (or empty) within just the shown
// buckets — an accepted tradeoff, not a bug. Scoping the ranking query to
// the displayed buckets too would need a second, axis-order-dependent
// ranking pass (an extra round-trip gated behind axisOrder resolving first),
// and "top by all-time total" is arguably the more expected reading of "top
// group" than "top only within whatever the x-axis limit already kept."
export const loadDataResultsGroupOrderArgs = ({
  dataset,
  groupBy,
  measure,
  sortDirection,
  limit,
  timezone,
}: LoadDataResultsGroupOrderArgs): LoadDataRequest => {
  return {
    from: dataset,
    select: [groupBy, measure],
    orderBy: [
      {
        property: measure,
        direction: getSortDirectionValue(sortDirection) ?? SortDirectionTypeOptions.desc,
      },
    ],
    limit: getLimit(limit),
    timezone,
  };
};

type LoadDataResultsGroupOrder = {
  dataset: Dataset;
  groupBy: Dimension;
  measure: Measure;
  limitTopGroupBy?: number;
  sortDirection?: OrderDirection;
  timezone?: string;
};

export const loadDataResultsGroupOrder = ({
  dataset,
  groupBy,
  measure,
  limitTopGroupBy,
  sortDirection,
  timezone,
}: LoadDataResultsGroupOrder): DataResponse | undefined => {
  if (!shouldGetTopGroupItems(measure, limitTopGroupBy)) return undefined;

  return loadData(
    loadDataResultsGroupOrderArgs({
      dataset,
      groupBy,
      measure,
      sortDirection,
      limit: getGroupOrderLimit(limitTopGroupBy),
      timezone,
    }),
  );
};

export const getGroupOrderCacheKey = ({
  dataset,
  groupBy,
  measure,
  sortDirection,
  limit,
  timezone,
}: LoadDataResultsGroupOrderArgs): string | undefined => {
  if (!shouldGetTopGroupItems(measure, limit)) return undefined;
  return JSON.stringify(
    loadDataResultsGroupOrderArgs({
      dataset,
      groupBy,
      measure,
      sortDirection,
      limit: getGroupOrderLimit(limit),
      timezone,
    }),
  );
};

export const getCachedGroupOrder = (
  groupOrderCacheKey: string | undefined,
  state: { groupOrderCacheKey?: string; groupOrder?: string[] } | undefined,
): string[] | undefined => {
  if (groupOrderCacheKey == null || groupOrderCacheKey !== state?.groupOrderCacheKey)
    return undefined;
  return state?.groupOrder;
};

// ---- Group Other (the "Other" bucket aggregate) ----
//
// Fetches one grand-total row per axis bucket, with NO groupBy filter at all
// — "Other" is computed client-side as grandTotal - sum(kept groups) in
// mergeGroupOtherResults/computeOtherRows (charts.utils.ts). That subtraction
// is only valid for additive measures, which is exactly what this feature is
// already scoped to (see isOtherBucketableMeasure). It's deliberately NOT
// done via an exclusion filter: notContains does substring matching, so a
// group value that's a superstring of a kept value (e.g. "Widget Pro" vs a
// kept "Widget") would be wrongly excluded from Other too and its
// contribution silently dropped; notEquals + an array value has no precedent
// anywhere else in this codebase. Subtraction sidesteps both risks.

type LoadDataResultsGroupOtherArgs = {
  dataset: Dataset;
  axis: Dimension;
  measure: Measure;
  axisOrder?: string[];
  maxResults?: number;
  timezone?: string;
};

export const loadDataResultsGroupOtherArgs = ({
  dataset,
  axis,
  measure,
  axisOrder,
  maxResults,
  timezone,
}: LoadDataResultsGroupOtherArgs): LoadDataRequest => {
  const request: LoadDataRequest = {
    from: dataset,
    select: [axis, measure],
    limit: getLimit(maxResults),
    timezone,
  };
  if (axisOrder?.length) {
    request.filters = [{ property: axis, operator: 'equals', value: axisOrder }];
  }
  return request;
};

type LoadDataResultsGroupOther = {
  dataset: Dataset;
  axis: Dimension;
  measure: Measure;
  granularity?: Granularity;
  groupOrder?: string[];
  limitTopGroupBy?: number;
  sortDirection?: OrderDirection;
  limitTopAxis?: number;
  axisOrder?: string[];
  maxResults?: number;
  timezone?: string;
};

export const loadDataResultsGroupOther = ({
  dataset,
  axis,
  measure,
  granularity,
  groupOrder,
  limitTopGroupBy,
  sortDirection,
  limitTopAxis,
  axisOrder,
  maxResults,
  timezone,
}: LoadDataResultsGroupOther): DataResponse | undefined => {
  if (groupOrder == null) return undefined;
  if (!groupOrder.length) return EMPTY_RESULTS;
  // Every group fits within the limit, so there's nothing to bucket — skip the
  // grand-total query; computeOtherRows then produces no "Other" rows.
  if (!resolveGroupOrder(groupOrder, limitTopGroupBy).hasOtherGroup) return EMPTY_RESULTS;

  // Wait for axisOrder too when axis top-N is configured, same as
  // loadDataResults — otherwise this fires once unfiltered (fetching every
  // axis bucket) as soon as groupOrder lands, then again once axisOrder
  // arrives. Not a correctness issue (mergeGroupOtherResults only acts once
  // both queries have settled, and the main query is blocked on axisOrder
  // too, so the unfiltered response is never actually consumed) — just a
  // wasted round-trip.
  if (shouldGetTopItems(sortDirection, limitTopAxis)) {
    if (axisOrder == null) return undefined;
    if (!axisOrder.length) return EMPTY_RESULTS;
  }

  return loadData(
    loadDataResultsGroupOtherArgs({
      dataset,
      axis: getDimensionWithGranularity(axis, granularity),
      measure,
      axisOrder,
      maxResults,
      timezone,
    }),
  );
};

// ---- Results ----

type LoadDataResultsArgs = {
  dataset: Dataset;
  axis: Dimension;
  groupBy: Dimension;
  measure: Measure;
  limit?: number;
  axisOrder?: string[];
  groupOrder?: string[];
  timezone?: string;
};

export const loadDataResultsArgs = ({
  dataset,
  axis,
  groupBy,
  measure,
  limit,
  axisOrder,
  groupOrder,
  timezone,
}: LoadDataResultsArgs): LoadDataRequest => {
  const request: LoadDataRequest = {
    from: dataset,
    select: [axis, groupBy, measure],
    limit: getLimit(limit),
    timezone,
  };
  const filters: NonNullable<LoadDataRequest['filters']> = [];
  if (axisOrder?.length) {
    filters.push({ property: axis, operator: 'equals', value: axisOrder });
  }
  if (groupOrder?.length) {
    filters.push({ property: groupBy, operator: 'equals', value: groupOrder });
  }
  if (filters.length) request['filters'] = filters;
  return request;
};

type LoadDataResults = {
  dataset: Dataset;
  axis: Dimension;
  groupBy: Dimension;
  measure: Measure;
  granularity?: Granularity;
  sortDirection?: OrderDirection;
  limitTopAxis?: number;
  limitTopGroupBy?: number;
  maxResults?: number;
  axisOrder?: string[];
  groupOrder?: string[];
  timezone?: string;
};

export const loadDataResults = ({
  dataset,
  axis,
  groupBy,
  measure,
  granularity,
  sortDirection,
  limitTopAxis,
  limitTopGroupBy,
  maxResults,
  axisOrder,
  groupOrder,
  timezone,
}: LoadDataResults): DataResponse | undefined => {
  const needsTopAxisItems = shouldGetTopItems(sortDirection, limitTopAxis);
  const needsTopGroupItems = shouldGetTopGroupItems(measure, limitTopGroupBy);
  const axisWithGranularity = getDimensionWithGranularity(axis, granularity);
  const { keptGroups } = resolveGroupOrder(groupOrder, limitTopGroupBy);

  if (needsTopAxisItems) {
    if (axisOrder == null) return undefined;
    if (!axisOrder.length) return EMPTY_RESULTS;
  }
  if (needsTopGroupItems) {
    if (keptGroups == null) return undefined;
    if (!keptGroups.length) return EMPTY_RESULTS;
  }

  return loadData(
    loadDataResultsArgs({
      dataset,
      axis: axisWithGranularity,
      groupBy,
      measure,
      limit: maxResults,
      axisOrder: needsTopAxisItems ? axisOrder : undefined,
      groupOrder: needsTopGroupItems ? keptGroups : undefined,
      timezone,
    }),
  );
};
