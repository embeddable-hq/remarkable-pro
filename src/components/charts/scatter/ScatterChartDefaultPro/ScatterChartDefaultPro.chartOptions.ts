import type { Measure } from '@embeddable.com/core';
import type { Theme } from '../../../../theme/theme.types';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';

export const getScatterChartProMeasureFormattingProps = (
  { xMeasure, yMeasure }: { xMeasure: Measure; yMeasure: Measure },
  theme: Theme,
): {
  formatAxisTick: (axis: 'x' | 'y', value: number) => string;
  formatMeasureValue: (
    axis: 'x' | 'y',
    value: number | null | undefined,
    nullLabel: string,
  ) => string;
} => {
  const themeFormatter = getThemeFormatter(theme);
  const measureFor = (axis: 'x' | 'y') => (axis === 'x' ? xMeasure : yMeasure);

  return {
    formatAxisTick: (axis, value) => themeFormatter.data(measureFor(axis), value),
    formatMeasureValue: (axis, value, nullLabel) =>
      value === null || value === undefined
        ? nullLabel
        : themeFormatter.data(measureFor(axis), value),
  };
};
