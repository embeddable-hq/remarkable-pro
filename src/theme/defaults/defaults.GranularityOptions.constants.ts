import { SelectListOptionProps } from '@embeddable.com/remarkable-ui';

export const Granularity = {
  second: 'second',
  minute: 'minute',
  hour: 'hour',
  day: 'day',
  week: 'week',
  month: 'month',
  quarter: 'quarter',
  year: 'year',
} as const;

export type TGranularity = keyof typeof Granularity;
export type TGranularityValue = (typeof Granularity)[TGranularity];

export const defaultGranularitySelectFieldOptions: SelectListOptionProps[] = [
  { value: Granularity.second, label: 'defaults.granularityOptions.second|Second' },
  { value: Granularity.minute, label: 'defaults.granularityOptions.minute|Minute' },
  { value: Granularity.hour, label: 'defaults.granularityOptions.hour|Hour' },
  { value: Granularity.day, label: 'defaults.granularityOptions.day|Day' },
  { value: Granularity.week, label: 'defaults.granularityOptions.week|Week' },
  { value: Granularity.month, label: 'defaults.granularityOptions.month|Month' },
  { value: Granularity.quarter, label: 'defaults.granularityOptions.quarter|Quarter' },
  { value: Granularity.year, label: 'defaults.granularityOptions.year|Year' },
];
