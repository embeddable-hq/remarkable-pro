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
import { getDimensionWithGranularity } from '../utils/granularity.utils';
import {
  getSortDirectionValue,
  SortDirectionTypeOptions,
} from '../../types/SortDirection.type.emb';

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

// ---- Results ----

type LoadDataResultsArgs = {
  dataset: Dataset;
  axis: Dimension;
  groupBy: Dimension;
  measure: Measure;
  limit?: number;
  axisOrder?: string[];
  timezone?: string;
};

export const loadDataResultsArgs = ({
  dataset,
  axis,
  groupBy,
  measure,
  limit,
  axisOrder,
  timezone,
}: LoadDataResultsArgs): LoadDataRequest => {
  const request: LoadDataRequest = {
    from: dataset,
    select: [axis, groupBy, measure],
    limit: getLimit(limit),
    timezone,
  };
  if (axisOrder?.length) {
    request['filters'] = [{ property: axis, operator: 'equals', value: axisOrder }];
  }
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
  maxResults?: number;
  axisOrder?: string[];
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
  maxResults,
  axisOrder,
  timezone,
}: LoadDataResults): DataResponse | undefined => {
  const needsTopItems = shouldGetTopItems(sortDirection, limitTopAxis);
  const axisWithGranularity = getDimensionWithGranularity(axis, granularity);
  if (!needsTopItems) {
    return loadData(
      loadDataResultsArgs({
        dataset,
        axis: axisWithGranularity,
        groupBy,
        measure,
        limit: maxResults,
        timezone,
      }),
    );
  }
  if (axisOrder == null) return undefined;
  if (!axisOrder?.length) return EMPTY_RESULTS;
  return loadData(
    loadDataResultsArgs({
      dataset,
      axis: axisWithGranularity,
      groupBy,
      measure,
      limit: maxResults,
      axisOrder,
      timezone,
    }),
  );
};
