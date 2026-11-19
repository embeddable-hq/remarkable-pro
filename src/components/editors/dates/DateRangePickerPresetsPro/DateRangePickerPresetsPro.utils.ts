import { DateRangeSelectFieldProOption } from './DateRangePickerPresetsPro.types';
import { SelectListOptionProps } from '@embeddable.com/remarkable-ui';
import { resolveI18nString } from '../../../component.utils';
import { getTimeRangeLabel } from '../dates.utils';
import { WeekStartsOn } from '../../../../utils/week.utils';

export const getDateRangeSelectFieldProOptions = (
  dateRangeSelectFieldProOptions: DateRangeSelectFieldProOption[],
  timezone?: string,
  weekStartsOn?: WeekStartsOn,
): SelectListOptionProps[] => {
  return dateRangeSelectFieldProOptions.map((option) => {
    return {
      rightLabel: getTimeRangeLabel(
        option.getRange(timezone, weekStartsOn),
        option.dateFormat,
        undefined,
        timezone,
      ),
      value: option.value,
      label: resolveI18nString(option.label),
    };
  });
};
