import { useEffect, useMemo } from 'react';
import { useTheme } from '@embeddable.com/react';
import { SingleSelectField } from '@embeddable.com/remarkable-ui';
import { TimeRange } from '@embeddable.com/core';
import { Theme } from '../../../theme/theme.types';
import { i18nSetup } from '../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../component.utils';
import { EditorCard } from '../shared/EditorCard/EditorCard';
import {
  getAvailableGranularityOptionsFromTimeRange,
  getGranularitySelectFieldOptions,
} from './GranularitySelectField.utils';

type DateRangePickerPresetsProps = {
  description?: string;
  onChange: (newGranularity: string) => void;
  placeholder?: string;
  primaryTimeRange: TimeRange;
  title?: string;
  granularity?: string;
  granularities?: string[];
};

const DateRangePickerPresets = (props: DateRangePickerPresetsProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const { granularity, granularities, onChange } = props;
  const { description, placeholder, title, primaryTimeRange } = resolveI18nProps(props);

  const granularitySelectFieldOptions = getGranularitySelectFieldOptions();

  const availableOptions = useMemo(() => {
    return getAvailableGranularityOptionsFromTimeRange(
      primaryTimeRange,
      granularitySelectFieldOptions.filter((opt) => granularities?.includes(opt.value as string)),
    );
  }, [primaryTimeRange, granularities]);

  useEffect(() => {
    if (granularity) {
      // Selected granularity not available - select 2nd or 1st available
      if (!availableOptions.some((opt) => opt.value === granularity)) {
        const newGranularity = (availableOptions[1] ?? availableOptions[0])?.value as string;
        if (newGranularity) {
          onChange(newGranularity);
        }
      }
    }
  }, [availableOptions, granularity, onChange]);

  const safeValue = availableOptions.some((opt) => opt.value === granularity)
    ? granularity
    : undefined;

  return (
    <EditorCard title={title} subtitle={description}>
      <SingleSelectField
        clearable
        placeholder={placeholder}
        value={safeValue}
        options={availableOptions}
        onChange={onChange}
      />
    </EditorCard>
  );
};

export default DateRangePickerPresets;
