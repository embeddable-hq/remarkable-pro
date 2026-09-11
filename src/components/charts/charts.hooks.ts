import { useEffect } from 'react';
import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { getDimensionFieldName } from '../../utils/data.utils';
import { mergeGroupOtherResults } from './charts.utils';

export function useUpdateAxisOrderAndCacheKey(opts: {
  resultsAxisOrder?: DataResponse;
  axisDimension: Dimension;
  setAxisOrderAndCacheKey?: (values: string[], cacheKey: string) => void;
  axisOrderCacheKey?: string;
}): void {
  const { resultsAxisOrder, axisDimension, setAxisOrderAndCacheKey, axisOrderCacheKey } = opts;

  useEffect(() => {
    if (
      !setAxisOrderAndCacheKey ||
      !resultsAxisOrder?.data ||
      resultsAxisOrder.isLoading ||
      !axisOrderCacheKey
    )
      return;

    const values = resultsAxisOrder.data
      .map((d) => d[axisDimension.name])
      .filter((v): v is string => v != null);

    setAxisOrderAndCacheKey(values, axisOrderCacheKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setAxisOrderAndCacheKey is recreated each render; other deps always change together with resultsAxisOrder
  }, [resultsAxisOrder]);
}

// Same shape as useUpdateAxisOrderAndCacheKey, but reads the response row
// using getDimensionFieldName rather than a plain .name lookup — the groupBy
// input accepts any dimension, including a time dimension with a granularity,
// whose response field key carries a `.granularity` suffix.
export function useUpdateGroupOrderAndCacheKey(opts: {
  resultsGroupOrder?: DataResponse;
  groupDimension: Dimension;
  setGroupOrderAndCacheKey?: (values: string[], cacheKey: string) => void;
  groupOrderCacheKey?: string;
}): void {
  const { resultsGroupOrder, groupDimension, setGroupOrderAndCacheKey, groupOrderCacheKey } = opts;
  const groupFieldName = getDimensionFieldName(groupDimension);

  useEffect(() => {
    if (
      !setGroupOrderAndCacheKey ||
      !resultsGroupOrder?.data ||
      resultsGroupOrder.isLoading ||
      !groupOrderCacheKey
    )
      return;

    const values = resultsGroupOrder.data
      .map((d) => d[groupFieldName])
      .filter((v): v is string => v != null);

    setGroupOrderAndCacheKey(values, groupOrderCacheKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setGroupOrderAndCacheKey is recreated each render; other deps always change together with resultsGroupOrder
  }, [resultsGroupOrder]);
}

// Combines useUpdateGroupOrderAndCacheKey with mergeGroupOtherResults — the
// per-component wiring every groupBy-bucketing chart needs (cache the ranked
// group order, then merge the main query with the "Other" aggregate) is
// otherwise identical across every chart that supports it, differing only in
// which dimension/measure objects get passed in.
export function useGroupOtherResults(opts: {
  mainResults?: DataResponse;
  resultsGroupOrder?: DataResponse;
  resultsGroupOther?: DataResponse;
  groupBy: Dimension;
  axis: Dimension;
  measure: Measure;
  groupOrderCacheKey?: string;
  setGroupOrderAndCacheKey?: (values: string[], cacheKey: string) => void;
}): DataResponse | undefined {
  const {
    mainResults,
    resultsGroupOrder,
    resultsGroupOther,
    groupBy,
    axis,
    measure,
    groupOrderCacheKey,
    setGroupOrderAndCacheKey,
  } = opts;

  useUpdateGroupOrderAndCacheKey({
    resultsGroupOrder,
    groupDimension: groupBy,
    setGroupOrderAndCacheKey,
    groupOrderCacheKey,
  });

  return mergeGroupOtherResults(mainResults, resultsGroupOther, groupBy, axis, measure);
}
