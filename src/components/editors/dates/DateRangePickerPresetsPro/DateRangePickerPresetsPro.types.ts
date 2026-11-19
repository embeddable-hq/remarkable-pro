import { TimeRange } from '@embeddable.com/core';
import { WeekStartsOn } from '../../../../utils/week.utils';

export type DateRangeSelectFieldProOption = {
  label: string;
  value: string;
  dateFormat: string;
  getRange: (timezone?: string, weekStartsOn?: WeekStartsOn) => TimeRange;
};
