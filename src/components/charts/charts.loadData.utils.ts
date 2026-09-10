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
  if (limit == null) return undefined;
  // Reserve one slot for the synthetic "Other" row, matching groupTailAsOther's
  // maxItems semantics (maxItems total = maxItems - 1 real + 1 Other).
  return Math.max(limit - 1, 0);
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
}: LoadDataResultsGroupOrderArgs & { limit?: number }): string | undefined => {
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
// Fetches one aggregated row per axis bucket for everything NOT in the kept
// top group values, using notContains rather than notEquals — this codebase's
// own filter-builder (filters.utils.ts) uses notContains for multi-value
// "is not one of" exclusion, so this mirrors an established, working pattern
// rather than relying on unproven notEquals + array semantics.

type LoadDataResultsGroupOtherArgs = {
  dataset: Dataset;
  axis: Dimension;
  groupBy: Dimension;
  measure: Measure;
  groupOrder: string[];
  axisOrder?: string[];
  maxResults?: number;
  timezone?: string;
};

export const loadDataResultsGroupOtherArgs = ({
  dataset,
  axis,
  groupBy,
  measure,
  groupOrder,
  axisOrder,
  maxResults,
  timezone,
}: LoadDataResultsGroupOtherArgs): LoadDataRequest => {
  const filters: NonNullable<LoadDataRequest['filters']> = [
    { property: groupBy, operator: 'notContains', value: groupOrder },
  ];
  if (axisOrder?.length) {
    filters.push({ property: axis, operator: 'equals', value: axisOrder });
  }
  return {
    from: dataset,
    select: [axis, measure],
    filters,
    limit: getLimit(maxResults),
    timezone,
  };
};

type LoadDataResultsGroupOther = {
  dataset: Dataset;
  axis: Dimension;
  groupBy: Dimension;
  measure: Measure;
  granularity?: Granularity;
  groupOrder?: string[];
  axisOrder?: string[];
  maxResults?: number;
  timezone?: string;
};

export const loadDataResultsGroupOther = ({
  dataset,
  axis,
  groupBy,
  measure,
  granularity,
  groupOrder,
  axisOrder,
  maxResults,
  timezone,
}: LoadDataResultsGroupOther): DataResponse | undefined => {
  if (groupOrder == null) return undefined;
  if (!groupOrder.length) return EMPTY_RESULTS;

  return loadData(
    loadDataResultsGroupOtherArgs({
      dataset,
      axis: getDimensionWithGranularity(axis, granularity),
      groupBy,
      measure,
      groupOrder,
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

  if (needsTopAxisItems) {
    if (axisOrder == null) return undefined;
    if (!axisOrder.length) return EMPTY_RESULTS;
  }
  if (needsTopGroupItems) {
    if (groupOrder == null) return undefined;
    if (!groupOrder.length) return EMPTY_RESULTS;
  }

  return loadData(
    loadDataResultsArgs({
      dataset,
      axis: axisWithGranularity,
      groupBy,
      measure,
      limit: maxResults,
      axisOrder: needsTopAxisItems ? axisOrder : undefined,
      groupOrder: needsTopGroupItems ? groupOrder : undefined,
      timezone,
    }),
  );
};
