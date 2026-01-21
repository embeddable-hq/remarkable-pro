import { useTheme } from '@embeddable.com/react';
import {
  Button,
  DateRangePicker,
  Dropdown,
  SelectFieldContent,
  SelectFieldContentList,
  SelectListOption,
  DateRange,
  SelectFieldTrigger,
  isSameDateRange,
  shallowEqual,
} from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../../theme/theme.types';
import { useLoadDayjsLocale } from '../../../../utils.ts/date.utils';
import { getDateRangeSelectFieldProOptions } from './DateRangePickerPresetsPro.utils';
import { TimeRange } from '@embeddable.com/core';
import { resolveI18nProps } from '../../../component.utils';
import { EditorCard } from '../../shared/EditorCard/EditorCard';
import { IconCalendarFilled, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { i18n, i18nSetup } from '../../../../theme/i18n/i18n';
import { useEffect, useState } from 'react';
import styles from './DateRangePickerPresetsPro.module.css';
import {
  getDateRangeFromTimeRange,
  getTimeRangeFromDateRange,
  getTimeRangeFromPresets,
  getTimeRangeLabel,
} from '../dates.utils';
import { ChartCardHeaderProps } from '../../../charts/shared/ChartCard/ChartCard';

type DateRangePickerPresetsProps = {
  onChange: (newDateRange: TimeRange) => void;
  placeholder?: string;
  selectedValue?: TimeRange;

  clearable?: boolean;
  showCustomRangeOptions?: boolean;
  showTwoMonths?: boolean;
} & ChartCardHeaderProps;

const DateRangePickerPresets = (props: DateRangePickerPresetsProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);
  const { dayjsLocaleReady } = useLoadDayjsLocale();
  const { onChange, clearable, selectedValue, showCustomRangeOptions, showTwoMonths } = props;
  const onlyDateRangePicker = !showCustomRangeOptions;
  const [showDateRangePicker, setShowDateRangePicker] = useState(onlyDateRangePicker);

  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    getDateRangeFromTimeRange(selectedValue),
  );

  const dateRangeOptions = theme.defaults.dateRangesOptions;

  useEffect(() => {
    if (!dayjsLocaleReady) {
      return;
    }
    // Step 1: Convert relativeTimeString to actual time range (from/to)
    const newTimeRange = getTimeRangeFromPresets(selectedValue, dateRangeOptions);

    if (!shallowEqual(newTimeRange, selectedValue)) {
      onChange(newTimeRange);
    }
  }, [selectedValue, dayjsLocaleReady, onChange, dateRangeOptions]);

  if (!dayjsLocaleReady) {
    return null;
  }

  const { description, placeholder, title } = resolveI18nProps(props);

  const options = getDateRangeSelectFieldProOptions(dateRangeOptions);

  // TODO: To improve after hotfix in remarkable-ui
  const handleOptionChange = (newValue: string | number | boolean | undefined) => {
    const newTimeRange = getTimeRangeFromPresets(
      { relativeTimeString: newValue } as TimeRange,
      dateRangeOptions,
    );

    onChange(newTimeRange);
    setDateRange(undefined);
  };

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    onChange(getTimeRangeFromDateRange(newDateRange));
    setIsOpen(false);
  };

  const handleClear = () => {
    setDateRange(undefined);
    onChange(undefined);
  };

  const getValueLabel = () => {
    if (selectedValue?.relativeTimeString) {
      const option = options.find((option) => option.value === selectedValue.relativeTimeString);
      if (option) {
        return option.label;
      }
    }

    if (selectedValue?.from && selectedValue?.to) {
      return getTimeRangeLabel(selectedValue, 'MMM DD');
    }

    return '';
  };

  const valueLabel = getValueLabel();

  const locale = theme.i18n.language ?? theme.formatter.locale;
  const isSubmitDisabled = isSameDateRange(dateRange, selectedValue);
  const numberOfMonths = showTwoMonths ? 2 : 1;

  return (
    <EditorCard title={title} subtitle={description}>
      <Dropdown
        open={isOpen}
        onOpenChange={setIsOpen}
        avoidCollisions={false}
        triggerComponent={
          <SelectFieldTrigger
            startIcon={IconCalendarFilled}
            aria-label={placeholder}
            placeholder={placeholder}
            valueLabel={valueLabel}
            onClear={handleClear}
            isClearable={clearable}
          />
        }
      >
        <SelectFieldContent fitContent className={styles.dateRangePickerContent}>
          {showDateRangePicker ? (
            <div className={styles.dateRangePickerContainer}>
              {!onlyDateRangePicker && (
                <SelectListOption
                  label={i18n.t('editors.dateRangePicker.backToPresets')}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDateRangePicker(false);
                  }}
                  startIcon={<IconChevronLeft />}
                />
              )}
              <DateRangePicker
                locale={locale}
                numberOfMonths={numberOfMonths}
                value={dateRange}
                onChange={setDateRange}
              />
              <Button
                size="small"
                disabled={isSubmitDisabled}
                onClick={() => handleDateRangeChange(dateRange)}
              >
                {i18n.t('editors.dateRangePicker.apply')}
              </Button>
            </div>
          ) : (
            <SelectFieldContentList>
              <SelectListOption
                label={i18n.t('editors.dateRangePicker.custom')}
                onClick={(e) => {
                  e.preventDefault();
                  setShowDateRangePicker(true);
                }}
                endIcon={<IconChevronRight />}
              />
              {options.map((option) => (
                <SelectListOption
                  key={option.value?.toString()}
                  {...option}
                  isSelected={selectedValue?.relativeTimeString === option.value}
                  onClick={() => handleOptionChange(option.value)}
                />
              ))}
            </SelectFieldContentList>
          )}
        </SelectFieldContent>
      </Dropdown>
    </EditorCard>
  );
};

export default DateRangePickerPresets;
