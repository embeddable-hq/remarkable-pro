import { useTheme } from '@embeddable.com/react';
import { TimeRange } from '@embeddable.com/core';
import { Theme } from '../../../theme/theme.types';
import { i18nSetup } from '../../../theme/i18n/i18n';
import { resolveI18nProps } from '../../component.utils';
import { EditorCard } from '../shared/EditorCard/EditorCard';
import { TGranularityValue } from '../../../theme/defaults/defaults.GranularityOptions.constants';
import { ChartCardHeaderProps } from '../../charts/shared/ChartCard/ChartCard';
import { GranularitySelectField } from '../shared/GranularitySelectField/GranularitySelectField';

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

  const { granularity, granularities, clearable, primaryTimeRange, onChange } = props;
  const { description, placeholder, title } = resolveI18nProps(props);

  return (
    <EditorCard title={title} subtitle={description}>
      <GranularitySelectField
        clearable={clearable}
        placeholder={placeholder}
        granularity={granularity}
        granularities={granularities}
        primaryTimeRange={primaryTimeRange}
        onChange={onChange}
      />
    </EditorCard>
  );
};

export default GranularitySelectFieldPro;
