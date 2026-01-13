import { SelectListOptionProps } from '@embeddable.com/remarkable-ui';

export const defaultGranularitySelectFieldOptions: SelectListOptionProps[] = [
  { value: 'second', label: 'defaults.granularityOptions.second|Second' },
  { value: 'minute', label: 'defaults.granularityOptions.minute|Minute' },
  { value: 'hour', label: 'defaults.granularityOptions.hour|Hour' },
  { value: 'day', label: 'defaults.granularityOptions.day|Day' },
  { value: 'week', label: 'defaults.granularityOptions.week|Week' },
  { value: 'month', label: 'defaults.granularityOptions.month|Month' },
  { value: 'quarter', label: 'defaults.granularityOptions.quarter|Quarter' },
  { value: 'year', label: 'defaults.granularityOptions.year|Year' },
];
