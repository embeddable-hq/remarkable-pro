import { useEffect } from 'react';
import { DataResponse, Dimension } from '@embeddable.com/core';

export function useUpdateAxisOrder(opts: {
  resultsAxisOrder?: DataResponse;
  axisDimension: Dimension;
  setAxisOrder?: (values: string[], cacheKey: string) => void;
  axisOrderCacheKey?: string;
}): void {
  const { resultsAxisOrder, axisDimension, setAxisOrder, axisOrderCacheKey } = opts;

  useEffect(() => {
    if (
      !setAxisOrder ||
      !resultsAxisOrder?.data ||
      resultsAxisOrder.isLoading ||
      !axisOrderCacheKey
    )
      return;

    const values = resultsAxisOrder.data
      .map((d) => d[axisDimension.name])
      .filter((v): v is string => v != null);

    setAxisOrder(values, axisOrderCacheKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setAxisOrder is recreated each render; other deps always change together with resultsAxisOrder
  }, [resultsAxisOrder]);
}
