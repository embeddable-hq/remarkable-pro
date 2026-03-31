import { useEffect } from 'react';
import { DataResponse, Dimension } from '@embeddable.com/core';

export function useSyncAxisItems(
  resultsTotals: DataResponse | undefined,
  axisDimension: Dimension,
  setAxisItems: (values: string[], key: string) => void,
  currentTotalsKey?: string,
): void {
  useEffect(() => {
    if (!resultsTotals?.data || resultsTotals.isLoading || !currentTotalsKey) return;

    const values = resultsTotals.data
      .map((d) => d[axisDimension.name])
      .filter((v): v is string => v != null);

    setAxisItems(values, currentTotalsKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setAxisItems is recreated each render; other deps always change together with resultsTotals
  }, [resultsTotals]);
}
