import { LoadDataRequest } from '@embeddable.com/core';
import { HEIGHT_MODES, HeightMode } from '@embeddable.com/react';

export const isAutoHeight = (heightMode: HeightMode | undefined): boolean =>
  heightMode === HEIGHT_MODES.auto;

/** Auto height has no scroll box to page with, so it takes the whole allowance in one request. */
export const getResultsPagingArgs = (
  heightMode: HeightMode | undefined,
  page: number,
  pageSize: number,
  autoHeightMaxResults: number | undefined,
): Pick<LoadDataRequest, 'offset' | 'limit' | 'countRows'> =>
  isAutoHeight(heightMode)
    ? { offset: 0, limit: autoHeightMaxResults, countRows: true }
    : { offset: page * pageSize, limit: pageSize };
