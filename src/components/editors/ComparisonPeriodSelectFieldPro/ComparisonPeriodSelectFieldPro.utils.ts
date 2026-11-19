import { SelectListOptionProps } from '@embeddable.com/remarkable-ui';
import { TimeRange } from '@embeddable.com/core';
import { ComparisonPeriodSelectFieldProOption } from './ComparisonPeriodSelectFieldPro.types';
import { resolveI18nString } from '../../component.utils';
import { getTimeRangeLabel } from '../dates/dates.utils';
import { WeekStartsOn } from '../../../utils/week.utils';

// Checks if the comparison period type is available in the embeddable types
export const isComparisonPeriodAvailable = (
  option: string | undefined,
  comparisonPeriodSelectFieldProOptions: ComparisonPeriodSelectFieldProOption[],
): boolean => {
  return !option || comparisonPeriodSelectFieldProOptions.some((opt) => opt.value === option);
};

export const getComparisonPeriodSelectFieldProOptions = (
  comparisonPeriodSelectFieldProOptions: ComparisonPeriodSelectFieldProOption[],
  toCompareTimeRange: TimeRange,
  weekStartsOn?: WeekStartsOn,
): SelectListOptionProps[] => {
  return comparisonPeriodSelectFieldProOptions.map((option) => {
    return {
      rightLabel: toCompareTimeRange
        ? getTimeRangeLabel(option.getRange(toCompareTimeRange, weekStartsOn), option.dateFormat)
        : '',
      value: option.value,
      label: resolveI18nString(option.label),
    };
  });
};
