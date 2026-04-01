import {
  DataResponse,
  Dataset,
  Dimension,
  LoadDataRequest,
  Measure,
  OrderDirection,
} from '@embeddable.com/core';

export const toOrderDirection = (value?: string): 'asc' | 'desc' | undefined => {
  if (value === 'Ascending') return 'asc';
  if (value === 'Descending') return 'desc';
  return undefined;
};

export const getLimit = (limit?: number): number | undefined =>
  typeof limit === 'number' && Number.isInteger(limit) && limit > 0 ? limit : undefined;

export const shouldGetTopItems = (sortDirection?: string, limit?: number): boolean =>
  toOrderDirection(sortDirection) != null || getLimit(limit) != null;

export const buildAxisOrderArgs = (opts: {
  dataset: Dataset;
  axis: Dimension;
  measure: Measure;
  sortDirection?: string;
  limit?: number;
}): LoadDataRequest => {
  const direction: OrderDirection = toOrderDirection(opts.sortDirection) ?? 'desc';

  return {
    from: opts.dataset,
    select: [opts.axis, opts.measure],
    orderBy: [{ property: opts.measure, direction }],
    limit: getLimit(opts.limit),
  };
};

export const buildResultsArgs = (opts: {
  dataset: Dataset;
  axis: Dimension;
  groupBy: Dimension;
  measure: Measure;
  maxResults: number;
  axisOrder?: string[];
}): LoadDataRequest => {
  const base: LoadDataRequest = {
    limit: opts.maxResults,
    from: opts.dataset,
    select: [opts.axis, opts.groupBy, opts.measure],
  };

  if (opts.axisOrder?.length) {
    return {
      ...base,
      filters: [{ property: opts.axis, operator: 'equals', value: opts.axisOrder }],
    };
  }

  return base;
};

const EMPTY_RESULTS = { data: [], isLoading: false } as DataResponse;

export const resolveResults = (
  needsTopItems: boolean,
  axisOrderFresh: boolean,
  axisOrder: string[] | undefined,
  loadResults: (axisOrder?: string[]) => DataResponse,
): DataResponse | undefined => {
  if (!needsTopItems) return loadResults();
  if (!axisOrderFresh) return undefined;
  if (!axisOrder?.length) return EMPTY_RESULTS;
  return loadResults(axisOrder);
};
