import { useTheme } from '@embeddable.com/react';
import { DateRange, DateRangePickerField } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../../theme/theme.types';
import { useLoadDayjsLocale } from '../../../../utils.ts/date.utils';
import { TimeRange } from '@embeddable.com/core';
import { resolveI18nProps } from '../../../component.utils';
import { EditorCard } from '../../shared/EditorCard/EditorCard';
import { i18n, i18nSetup } from '../../../../theme/i18n/i18n';
import {
  getDateRangeFromTimeRange,
  getTimeRangeFromDateRange,
  getTimeRangeLabel,
} from '../dates.utils';
import { IconCalendarFilled } from '@tabler/icons-react';
import { ChartCardHeaderProps } from '../../../charts/shared/ChartCard/ChartCard';

type DateRangePickerPresetsProps = {
  onChange: (newDateRange: TimeRange) => void;
  placeholder?: string;
  selectedValue?: TimeRange;
  clearable?: boolean;
  showTwoMonths?: boolean;
} & ChartCardHeaderProps;

const DateRangePickerPresets = (props: DateRangePickerPresetsProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const { dayjsLocaleReady } = useLoadDayjsLocale();

  if (!dayjsLocaleReady) {
    return null;
  }

  const { onChange, clearable, selectedValue, showTwoMonths } = props;

  const { description, placeholder, title } = resolveI18nProps(props);

  const handleChange = (newDateRange: DateRange | undefined) => {
    const timeRange: TimeRange = getTimeRangeFromDateRange(newDateRange);
    onChange(timeRange);
  };

  const dateRangeOptions = theme.defaults.dateRangesOptions;
  const displayValue = getTimeRangeLabel(selectedValue, 'MMM DD', dateRangeOptions);

  const locale = theme.i18n.language ?? theme.formatter.locale;

  return (
    <EditorCard title={title} subtitle={description}>
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
      />
    </EditorCard>
  );
};

export default DateRangePickerPresets;
