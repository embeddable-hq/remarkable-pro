import { TimeRange } from '@embeddable.com/core';

/**
 * Matches the HeatMapCellClickArg exported from @embeddable.com/remarkable-ui.
 * Kept here to avoid a version-coupling import until the remarkable-ui update ships.
 */
export type HeatMapCellClickArg = {
  /** Raw string value of the row dimension for the clicked cell. */
  rowDimensionValue: string;
  /** Raw string value of the column dimension for the clicked cell. */
  columnDimensionValue: string;
};

export type HeatMapProOptionsClickArg = {
  /** Raw string value of the row dimension for the clicked cell. */
  rowDimensionValue: string | undefined;
  /** Time range for the row dimension (populated when row is a time dimension). */
  rowDimensionTimeRange: TimeRange | undefined;
  /** Raw string value of the column dimension for the clicked cell. */
  columnDimensionValue: string | undefined;
  /** Time range for the column dimension (populated when column is a time dimension). */
  columnDimensionTimeRange: TimeRange | undefined;
};
