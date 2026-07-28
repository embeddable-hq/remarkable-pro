import { useTheme } from '@embeddable.com/react';
import { SingleSelectField } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../theme/theme.types';
import { useLoadDayjsLocale } from '../../../utils/date.utils';
import { TimeRange } from '@embeddable.com/core';
import { resolveI18nProps } from '../../component.utils';
import { EditorCard, EditorCardHeaderProps } from '../shared/EditorCard/EditorCard';
import { IconCalendarTime } from '@tabler/icons-react';
import { i18n, i18nSetup } from '../../../theme/i18n/i18n';
import {
  getComparisonPeriodSelectFieldProOptions,
  isComparisonPeriodAvailable,
} from './ComparisonPeriodSelectFieldPro.utils';
import { useEffect, useMemo } from 'react';
import { getTimeRangeFromPresets } from '../dates/dates.utils';
import { dispatchEventUserInteraction } from '../../../utils/events.utils';

export type DateComparisonSelectFieldPro = {
  placeholder?: string;
  primaryDateRange?: TimeRange;
  comparisonPeriod?: string;
  componentName?: string;
  trackingId?: string;
  onChange: (newComparisonPeriod?: string | null) => void;
} & EditorCardHeaderProps;

const DateComparisonSelectFieldPro = (props: DateComparisonSelectFieldPro) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const { description, placeholder, title, tooltip } = resolveI18nProps(props);
  const { comparisonPeriod, componentName, trackingId, onChange } = props;

  const comparisonPeriodOptions = theme.defaults.comparisonPeriodsOptions;

  const comparisonPeriodAvailable = useMemo(
    () => isComparisonPeriodAvailable(comparisonPeriod, comparisonPeriodOptions),
    [comparisonPeriod, comparisonPeriodOptions],
  );

  // If the current comparison period is not available, reset the field
  useEffect(() => {
    if (!comparisonPeriodAvailable) {
      onChange(undefined);
    }
  }, [comparisonPeriodAvailable, onChange]);

  const { dayjsLocaleReady } = useLoadDayjsLocale();

  // Obtain the actual range for the selected primaryDateRange
  const primaryDateRange = getTimeRangeFromPresets(
    props.primaryDateRange,
    theme.defaults.dateRangesOptions,
    theme.clientContext.timezone,
  );

  if (!dayjsLocaleReady) {
    return null;
  }

  const options = getComparisonPeriodSelectFieldProOptions(
    comparisonPeriodOptions,
    primaryDateRange,
  );

  const handleChange = (newComparisonPeriod?: string | null) => {
    dispatchEventUserInteraction({ componentName, trackingId, value: newComparisonPeriod });
    onChange(newComparisonPeriod);
  };

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <SingleSelectField
        startIcon={IconCalendarTime}
        clearable
        placeholder={placeholder}
        value={comparisonPeriodAvailable ? comparisonPeriod : undefined}
        onChange={handleChange}
        options={options}
        noOptionsMessage={i18n.t('common.noOptionsAvailable')}
        avoidCollisions={false}
      />
    </EditorCard>
  );
};

export default DateComparisonSelectFieldPro;
