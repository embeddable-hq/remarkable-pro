import { TimeRange } from '@embeddable.com/core';

export type SimpleClickArg = {
  dimensionValue: string | undefined;
  dimensionTimeRange: TimeRange | undefined;
};

export type GroupedClickArg = SimpleClickArg & {
  groupingDimensionValue: string | undefined;
  groupingDimensionTimeRange: TimeRange | undefined;
};
