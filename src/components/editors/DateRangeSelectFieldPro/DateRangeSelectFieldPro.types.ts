import { TimeRange } from '@embeddable.com/core';

export type DateRangeSelectFieldProOption = {
  label: string;
  value: string;
  dateFormat: string;
  getRange: () => TimeRange;
};
