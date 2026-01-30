import { useEffect, useMemo } from 'react';
import { useTheme } from '@embeddable.com/react';
import { SingleSelectField } from '@embeddable.com/remarkable-ui';
import { Granularity, TimeRange } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { i18nSetup } from '../../../../theme/i18n/i18n';
import {
  getAvailableGranularityOptionsFromTimeRange,
  getGranularitySelectFieldOptions,
  getSafeSelection,
} from './GranularitySelectField.utils';
import { TGranularityValue } from '../../../../theme/defaults/defaults.GranularityOptions.constants';
import { ChartCardHeaderProps } from '../../../charts/shared/ChartCard/ChartCard';
import { SingleSelectFieldProps } from '@embeddable.com/remarkable-ui';

export type GranularitySelectFieldProps = {
  onChange: (newGranularity: Granularity) => void;
  primaryTimeRange?: TimeRange;
  granularity?: TGranularityValue;
  granularities?: TGranularityValue[];
} & ChartCardHeaderProps &
  Pick<SingleSelectFieldProps, 'variant' | 'side' | 'align' | 'clearable' | 'placeholder'>;

export const GranularitySelectField = (props: GranularitySelectFieldProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    granularity,
    granularities,
    clearable,
    placeholder,
    primaryTimeRange,
    variant,
    side,
    align,
    onChange,
  } = props;

  const granularitySelectFieldOptions = getGranularitySelectFieldOptions();

  const availableOptions = useMemo(() => {
    return getAvailableGranularityOptionsFromTimeRange(
      primaryTimeRange,
      granularitySelectFieldOptions.filter((opt) =>
        granularities?.includes(opt.value as TGranularityValue),
      ),
    );
  }, [primaryTimeRange, granularities]);

  useEffect(() => {
    if (granularity) {
      // Selected granularity is not available
      // Select 1st available option when number of options is =< 2
      // Select 2nd option to avoid when number of options > 2
      if (!availableOptions.some((opt) => opt.value === granularity)) {
        const newGranularity = getSafeSelection(availableOptions, granularity);
        if (newGranularity) {
          onChange(newGranularity as Granularity);
        }
      }
    }
  }, [availableOptions, granularity, onChange]);

  const safeValue = getSafeSelection(availableOptions, granularity);

  return (
    <SingleSelectField
      variant={variant}
      clearable={clearable}
      placeholder={placeholder}
      value={safeValue}
      options={availableOptions}
      onChange={(newValue) => onChange(newValue as Granularity)}
      avoidCollisions={false}
      side={side}
      align={align}
    />
  );
};
