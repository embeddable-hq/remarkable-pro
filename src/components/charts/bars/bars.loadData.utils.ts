import { Dataset, Dimension, LoadDataRequest, Measure, OrderDirection } from '@embeddable.com/core';

const SORT_DIRECTION_MAP: Record<string, OrderDirection> = {
  Ascending: 'asc',
  Descending: 'desc',
};

export const parseSortDirection = (value?: string): OrderDirection | undefined =>
  value ? SORT_DIRECTION_MAP[value] : undefined;

export const isValidLimit = (limit?: number): limit is number =>
  typeof limit === 'number' && Number.isInteger(limit) && limit > 0;

export const hasSortOrLimit = (sortByAxisTotal?: string, limitAxisItems?: number): boolean =>
  !!parseSortDirection(sortByAxisTotal) || isValidLimit(limitAxisItems);

export const loadDataTotalsArgs = (
  dataset: Dataset,
  axis: Dimension,
  measure: Measure,
  sortByAxisTotal?: string,
  limitAxisItems?: number,
): LoadDataRequest => {
  const direction = parseSortDirection(sortByAxisTotal) ?? 'desc';

  return {
    from: dataset,
    select: [axis, measure],
    orderBy: [{ property: measure, direction }],
    limit: isValidLimit(limitAxisItems) ? limitAxisItems : undefined,
  };
};

export const loadDataMainArgs = (
  dataset: Dataset,
  axis: Dimension,
  groupBy: Dimension,
  measure: Measure,
  maxResults: number,
  axisItems?: string[],
): LoadDataRequest => {
  const base: LoadDataRequest = {
    limit: maxResults,
    from: dataset,
    select: [axis, groupBy, measure],
  };

  if (axisItems?.length) {
    return {
      ...base,
      filters: [{ property: axis, operator: 'equals', value: axisItems }],
    };
  }

  return base;
};
