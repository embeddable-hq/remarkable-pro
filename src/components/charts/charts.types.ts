import { TimeRange } from '@embeddable.com/core';

export type DimensionValueOrTimeRange = string | TimeRange | undefined;

export type SimpleClickArg = {
  dimensionValue: string | undefined;
  dimensionTimeRange: TimeRange | undefined;
  measureValues?: Record<string, unknown>;
};

export type GroupedClickArg = SimpleClickArg & {
  groupingDimensionValue: string | undefined;
  groupingDimensionTimeRange: TimeRange | undefined;
};
