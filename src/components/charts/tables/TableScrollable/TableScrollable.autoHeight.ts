import { LoadDataRequest } from '@embeddable.com/core';
import { HEIGHT_MODES, HeightMode } from '@embeddable.com/react';

export const isAutoHeight = (heightMode: HeightMode | undefined): boolean =>
  heightMode === HEIGHT_MODES.auto;

/**
 * Paging slice for the table's main query.
 *
 * Fixed height walks the dataset `pageSize` rows at a time as the viewer scrolls the tile. Auto height
 * has no scroll box left to drive that — the runtime lets the tile grow to its content instead — so it
 * takes the whole `maxResults` allowance in one request. `countRows` comes back as `total`, which is
 * what lets the card say the view is still short of the full query.
 */
export const getResultsPagingArgs = (
  heightMode: HeightMode | undefined,
  page: number,
  pageSize: number,
  maxResults: number | undefined,
): Pick<LoadDataRequest, 'offset' | 'limit' | 'countRows'> =>
  isAutoHeight(heightMode)
    ? { offset: 0, limit: maxResults, countRows: true }
    : { offset: page * pageSize, limit: pageSize };
