import { TimeRange } from '@embeddable.com/core';
import { WeekStartsOn } from '../../../utils/week.utils';

export type ComparisonPeriodSelectFieldProOption = {
  label: string;
  value: string;
  dateFormat: string;
  getRange: (dateRange: TimeRange, weekStartsOn?: WeekStartsOn) => TimeRange;
};
