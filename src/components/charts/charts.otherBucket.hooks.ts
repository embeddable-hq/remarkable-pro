import { useEffect } from 'react';
import { DataResponse, Dimension } from '@embeddable.com/core';
import { getOtherBucketHeadInfo, OtherBucketHeadInfo } from './charts.otherBucket.utils';

export function useUpdateOtherBucketState(opts: {
  results?: DataResponse;
  dimension: Dimension;
  maxItems?: number;
  maxResults?: number;
  cacheKey?: string;
  setOtherBucketState?: (info: OtherBucketHeadInfo, cacheKey: string) => void;
}): void {
  const { results, dimension, maxItems, maxResults, cacheKey, setOtherBucketState } = opts;

  useEffect(() => {
    if (!setOtherBucketState || !results?.data || results.isLoading || !cacheKey) return;

    setOtherBucketState(
      getOtherBucketHeadInfo(results.data, dimension, maxItems, maxResults),
      cacheKey,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setOtherBucketState is recreated each render; other deps always change together with results
  }, [results, cacheKey]);
}
