import { DateRangeSelectFieldProOption } from './DateRangePickerPresets.types';
import { SelectListOptionProps } from '@embeddable.com/remarkable-ui';
import { getTimeRangeLabel } from '../editors.timeRange.utils';
import { resolveI18nString } from '../../component.utils';

export const getDateRangeSelectFieldProOptions = (
  dateRangeSelectFieldProOptions: DateRangeSelectFieldProOption[],
): SelectListOptionProps[] => {
  return dateRangeSelectFieldProOptions.map((option) => {
    return {
      rightLabel: getTimeRangeLabel(option.getRange(), option.dateFormat),
      value: option.value,
      label: resolveI18nString(option.label),
    };
  });
};
