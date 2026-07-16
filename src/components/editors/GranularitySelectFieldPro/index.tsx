import { useTheme } from '@embeddable.com/react';
import { TimeRange } from '@embeddable.com/core';
import { Theme } from '../../../theme/theme.types';
import { i18nSetup } from '../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../component.utils';
import { EditorCard, EditorCardHeaderProps } from '../shared/EditorCard/EditorCard';
import { TGranularityValue } from '../../../theme/defaults/defaults.GranularityOptions.constants';
import { GranularitySelectField } from '../shared/GranularitySelectField/GranularitySelectField';
import { dispatchEventUserInteraction } from '../../../utils/events.utils';

export type GranularitySelectFieldProProps = {
  onChange: (newGranularity: string) => void;
  placeholder?: string;
  primaryTimeRange?: TimeRange;
  granularity?: TGranularityValue;
  granularities?: TGranularityValue[];
  clearable?: boolean;
  componentName?: string;
  trackingId?: string;
} & EditorCardHeaderProps;

const GranularitySelectFieldPro = (props: GranularitySelectFieldProProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    granularity,
    granularities,
    clearable,
    primaryTimeRange,
    componentName,
    trackingId,
    onChange,
  } = props;
  const { description, tooltip, placeholder, title } = resolveI18nProps(props);

  const handleChange = (newGranularity: string) => {
    dispatchEventUserInteraction({ componentName, trackingId, value: newGranularity });
    onChange(newGranularity);
  };

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <GranularitySelectField
        clearable={clearable}
        placeholder={placeholder}
        granularity={granularity}
        granularities={granularities}
        primaryTimeRange={primaryTimeRange}
        onChange={handleChange}
      />
    </EditorCard>
  );
};

export default GranularitySelectFieldPro;
