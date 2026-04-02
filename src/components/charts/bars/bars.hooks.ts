import { useEffect } from 'react';
import { DataResponse, Dimension } from '@embeddable.com/core';

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
