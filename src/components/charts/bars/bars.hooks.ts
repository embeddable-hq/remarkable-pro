import { useEffect } from 'react';
import { DataResponse, Dimension } from '@embeddable.com/core';

export function useUpdateAxisOrder(opts: {
  resultsAxisOrder?: DataResponse;
  axisDimension: Dimension;
  setAxisOrder?: (values: string[], key: string) => void;
  currentAxisOrderKey?: string;
}): void {
  const { resultsAxisOrder, axisDimension, setAxisOrder, currentAxisOrderKey } = opts;

  useEffect(() => {
    if (
      !setAxisOrder ||
      !resultsAxisOrder?.data ||
      resultsAxisOrder.isLoading ||
      !currentAxisOrderKey
    )
      return;

    const values = resultsAxisOrder.data
      .map((d) => d[axisDimension.name])
      .filter((v): v is string => v != null);

    setAxisOrder(values, currentAxisOrderKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setAxisOrder is recreated each render; other deps always change together with resultsAxisOrder
  }, [resultsAxisOrder]);
}
