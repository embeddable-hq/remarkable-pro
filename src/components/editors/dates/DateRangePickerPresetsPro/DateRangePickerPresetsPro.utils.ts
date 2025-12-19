import { DateRangeSelectFieldProOption } from './DateRangePickerPresetsPro.types';
import { SelectListOptionProps } from '@embeddable.com/remarkable-ui';
import { resolveI18nString } from '../../../component.utils';
import { getTimeRangeLabel } from '../dates.utils';

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
