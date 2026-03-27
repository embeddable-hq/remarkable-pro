import { Dimension, LoadDataRequest, Measure, OrderBy } from '@embeddable.com/core';

export const getValidLimit = (limitValue?: number): number | undefined => {
  if (typeof limitValue !== 'number' || !Number.isFinite(limitValue) || limitValue <= 0)
    return undefined;
  const floored = Math.floor(limitValue);
  return floored > 0 ? floored : undefined;
};

export const hasSortOrLimit = (sortByAxisTotal?: string, limitAxisItems?: number): boolean => {
  return !!sortByAxisTotal || getValidLimit(limitAxisItems) !== undefined;
};

export const getSortDirection = (sortByAxisTotal?: string): 'asc' | 'desc' => {
  if (sortByAxisTotal === 'Ascending') return 'asc';
  if (sortByAxisTotal === 'Descending') return 'desc';
  return 'desc';
};

export const buildTotalsRequest = (params: {
  dataset: LoadDataRequest['from'];
  axisDimension: Dimension;
  measure: Measure;
  sortByAxisTotal?: string;
  limitAxisItems?: number;
}): LoadDataRequest | undefined => {
  if (!hasSortOrLimit(params.sortByAxisTotal, params.limitAxisItems)) return undefined;

  const orderBy: OrderBy[] = [
    { property: params.measure, direction: getSortDirection(params.sortByAxisTotal) },
  ];

  return {
    from: params.dataset,
    select: [params.axisDimension, params.measure],
    orderBy,
    limit: getValidLimit(params.limitAxisItems),
  };
};

export const getTotalsRequestKey = (params: {
  sortByAxisTotal?: string;
  limitAxisItems?: number;
  axisDimensionName: string;
  measureName: string;
}): string => {
  const limit = getValidLimit(params.limitAxisItems);
  return `${params.sortByAxisTotal ?? ''}:${limit ?? ''}:${params.axisDimensionName}:${params.measureName}`;
};

export const buildAxisTotalFilter = (
  axisDimension: Dimension,
  axisTotalValues?: string[],
): LoadDataRequest['filters'] => {
  if (!axisTotalValues?.length) return undefined;
  return [{ property: axisDimension, operator: 'equals' as const, value: axisTotalValues }];
};
