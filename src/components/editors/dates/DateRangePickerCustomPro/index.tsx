import { useTheme } from '@embeddable.com/react';
import { DateRange, DateRangePickerField } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../../theme/theme.types';
import { useLoadDayjsLocale } from '../../../../utils/date.utils';
import { TimeRange } from '@embeddable.com/core';
import { resolveI18nProps } from '../../../component.utils';
import { EditorCard, EditorCardHeaderProps } from '../../shared/EditorCard/EditorCard';
import { i18n, i18nSetup } from '../../../../theme/i18n/i18n';
import {
  getDateRangeFromTimeRange,
  getTimeRangeFromDateRange,
  getTimeRangeLabel,
} from '../dates.utils';
import { IconCalendarFilled } from '@tabler/icons-react';

type DateRangePickerPresetsProps = {
  onChange: (newDateRange: TimeRange) => void;
  placeholder?: string;
  selectedValue?: TimeRange;
  clearable?: boolean;
  showTwoMonths?: boolean;
} & EditorCardHeaderProps;

const DateRangePickerPresets = (props: DateRangePickerPresetsProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const { dayjsLocaleReady } = useLoadDayjsLocale();

  if (!dayjsLocaleReady) {
    return null;
  }

  const { description, placeholder, title, tooltip } = resolveI18nProps(props);
  const { onChange, clearable, selectedValue, showTwoMonths } = props;

  const handleChange = (newDateRange: DateRange | undefined) => {
    const timeRange: TimeRange = getTimeRangeFromDateRange(newDateRange);
    onChange(timeRange);
  };

  const dateRangeOptions = theme.defaults.dateRangesOptions;
  const displayValue = getTimeRangeLabel(selectedValue, 'MMM DD', dateRangeOptions);

  const locale = theme.i18n.language ?? theme.formatter.locale;

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <DateRangePickerField
        startIcon={IconCalendarFilled}
        locale={locale}
        clearable={clearable}
        placeholder={placeholder}
        displayValue={displayValue}
        numberOfMonths={showTwoMonths ? 2 : 1}
        value={getDateRangeFromTimeRange(selectedValue, dateRangeOptions)}
        onChange={handleChange}
        submitLabel={i18n.t('editors.dateRangePicker.apply')}
        avoidCollisions={false}
      />
    </EditorCard>
  );
};

export default DateRangePickerPresets;
