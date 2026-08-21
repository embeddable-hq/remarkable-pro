import {
  Dataset,
  DataResponse,
  Dimension,
  LoadDataRequest,
  Measure,
  QueryFilter,
  loadData,
} from '@embeddable.com/core';

export type OtherBucketHeadInfo = {
  active: boolean;
  headValues: string[];
};

export const getOtherBucketHeadCount = (maxItems?: number): number | undefined =>
  typeof maxItems === 'number' && maxItems > 0 ? maxItems - 1 : undefined;

export const getOtherBucketHeadInfo = (
  data: DataResponse['data'],
  dimension: Dimension,
  maxItems?: number,
  maxResults?: number,
): OtherBucketHeadInfo => {
  const rows = data ?? [];
  const headCount = getOtherBucketHeadCount(maxItems);
  const isBucketing = headCount != null && rows.length > headCount + 1;
  const isTruncated = Boolean(maxResults) && rows.length >= (maxResults as number);

  if (!isBucketing || !isTruncated || headCount == null) {
    return { active: false, headValues: [] };
  }

  return {
    active: true,
    headValues: rows
      .slice(0, headCount)
      .map((row) => row[dimension.name])
      .filter((v): v is string => v != null),
  };
};

export const getOtherBucketCacheKey = (
  primaryRequest: LoadDataRequest,
  maxItems?: number,
): string => JSON.stringify({ primaryRequest, maxItems });

export const getCachedOtherBucketState = (
  cacheKey: string,
  state:
    | {
        otherBucketCacheKey?: string;
        otherBucketActive?: boolean;
        otherBucketHeadValues?: string[];
      }
    | undefined,
): OtherBucketHeadInfo => {
  if (cacheKey !== state?.otherBucketCacheKey) return { active: false, headValues: [] };
  return {
    active: state?.otherBucketActive ?? false,
    headValues: state?.otherBucketHeadValues ?? [],
  };
};

export type GetOtherBucketAggregateArgsParams = {
  dataset: Dataset;
  dimension: Dimension;
  measures: Measure[];
  active: boolean;
  headValues: string[];
  timezone?: string;
};

export const getOtherBucketAggregateArgs = ({
  dataset,
  dimension,
  measures,
  active,
  headValues,
  timezone,
}: GetOtherBucketAggregateArgsParams): LoadDataRequest => {
  let filters: QueryFilter[] = [];

  if (!active) {
    filters = [{ property: dimension, operator: 'equals', value: [] }];
  } else if (headValues.length > 0) {
    filters = [{ property: dimension, operator: 'notEquals', value: headValues }];
  }

  return {
    from: dataset,
    select: [...measures],
    limit: 1,
    filters,
    timezone,
  };
};

export const loadOtherBucketAggregate = (params: GetOtherBucketAggregateArgsParams): DataResponse =>
  loadData(getOtherBucketAggregateArgs(params));
