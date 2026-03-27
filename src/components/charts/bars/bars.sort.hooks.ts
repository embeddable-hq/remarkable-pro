import { useEffect, useRef } from 'react';
import { DataResponse, Dimension } from '@embeddable.com/core';
import { useFillGaps } from '../charts.fillGaps.hooks';

export const useAxisTotals = (params: {
  totals?: DataResponse;
  totalsKey?: string;
  axisTotalValues?: string[];
  setAxisTotalValues?: (values: string[], key?: string) => void;
  results?: DataResponse;
  axisDimension: Dimension;
}): { results: DataResponse; axisOrder?: string[] } => {
  const {
    totals,
    totalsKey,
    axisTotalValues,
    setAxisTotalValues,
    results: rawResults,
    axisDimension,
  } = params;

  const callbackRef = useRef(setAxisTotalValues);
  callbackRef.current = setAxisTotalValues;

  useEffect(() => {
    if (!totals?.data || totals.isLoading || !callbackRef.current) return;
    const values = totals.data.map((d) => d[axisDimension.name] as string);
    callbackRef.current(values, totalsKey);
  }, [totals, axisDimension.name, totalsKey]);

  const results =
    useFillGaps({
      results: rawResults,
      dimension: axisDimension,
    }) ?? ({ isLoading: true, data: [] } as DataResponse);

  const axisOrder = axisTotalValues ?? totals?.data?.map((d) => d[axisDimension.name] as string);

  return { results, axisOrder };
};
