import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { i18n } from '../../theme/i18n/i18n';

export const groupTailAsOther = (
  data: DataResponse['data'] = [],
  dimension: Dimension,
  measures: Measure[],
  maxItems?: number,
) => {
  if (!maxItems || data.length <= maxItems) return data;

  const head = data.slice(0, maxItems - 1);
  const tail = data.slice(maxItems - 1);

  const aggregatedRow: Record<string, unknown> = {
    [dimension.name]: i18n.t('common.other'),
  };

  for (const measure of measures) {
    aggregatedRow[measure.name] = tail.reduce(
      (sum, row) => sum + parseFloat(row[measure.name] ?? '0'),
      0,
    );
  }

  return [...head, aggregatedRow];
};

export const getDatalabelPercentage = (value: number, data: unknown[]): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const total = data.reduce((sum: number, v: any) => sum + Number.parseFloat(v), 0);
  return `${Number.parseFloat(((value / total) * 100).toFixed(2))}%`;
};
