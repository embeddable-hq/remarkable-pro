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
  getSafeSelection,
} from './GranularitySelectFieldPro.utils';
import { TGranularityValue } from '../../../theme/defaults/defaults.GranularityOptions.constants';
import { ChartCardHeaderProps } from '../../charts/shared/ChartCard/ChartCard';

type GranularitySelectFieldProProps = {
  onChange: (newGranularity: string) => void;
  placeholder?: string;
  primaryTimeRange?: TimeRange;
  granularity?: TGranularityValue;
  granularities?: TGranularityValue[];
  clearable?: boolean;
} & ChartCardHeaderProps;

const GranularitySelectFieldPro = (props: GranularitySelectFieldProProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const { granularity, granularities, clearable, onChange } = props;
  const { description, placeholder, title, primaryTimeRange } = resolveI18nProps(props);

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
          onChange(newGranularity);
        }
      }
    }
  }, [availableOptions, granularity, onChange]);

  const safeValue = getSafeSelection(availableOptions, granularity);

  return (
    <EditorCard title={title} subtitle={description}>
      <SingleSelectField
        clearable={clearable}
        placeholder={placeholder}
        value={safeValue}
        options={availableOptions}
        onChange={onChange}
      />
    </EditorCard>
  );
};

export default GranularitySelectFieldPro;
