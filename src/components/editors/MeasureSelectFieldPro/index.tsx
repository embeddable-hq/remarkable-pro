import { useEffect, useMemo, useRef } from 'react';
import { Measure } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import { SingleSelectField } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../theme/theme.types';
import { i18nSetup } from '../../../theme/i18n/i18n';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { resolveI18nProps } from '../../component.utils';
import { EditorCard } from '../shared/EditorCard/EditorCard';
import { ChartCardHeaderProps } from '../../charts/shared/ChartCard/ChartCard';

type MeasureSelectFieldProProps = {
  measures?: Measure[];
  measure?: Measure;
  placeholder?: string;
  clearable?: boolean;
  onChange: (measure: Measure | null) => void;
} & ChartCardHeaderProps;

const MeasureSelectFieldPro = (props: MeasureSelectFieldProProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);
  const themeFormatter = getThemeFormatter(theme);

  const { measures, measure, clearable, onChange } = props;
  const { description, placeholder, title } = resolveI18nProps(props);

  const options = useMemo(
    () =>
      measures?.map((m) => ({
        value: m.name,
        label: themeFormatter.dimensionOrMeasureTitle(m),
      })) ?? [],
    [measures, themeFormatter],
  );

  // Track if we've already auto-selected to prevent repeated triggers
  const hasAutoSelected = useRef(false);

  // Auto-select first measure once when clearable=false and no default
  useEffect(() => {
    const firstMeasure = measures?.[0];
    if (!hasAutoSelected.current && !clearable && !measure && firstMeasure) {
      hasAutoSelected.current = true;
      onChange(firstMeasure);
    }
  }, [clearable, measure, measures, onChange]);

  // Use the measure's name directly as the selected value
  const selectedValue = measure?.name;

  const handleChange = (selectedName: string | null) => {
    if (!selectedName) {
      onChange(null);
      return;
    }
    const found = measures?.find((m) => m.name === selectedName);
    onChange(found ?? null);
  };

  return (
    <EditorCard title={title} subtitle={description}>
      <SingleSelectField
        clearable={clearable}
        placeholder={placeholder}
        value={selectedValue}
        options={options}
        onChange={handleChange}
      />
    </EditorCard>
  );
};

export default MeasureSelectFieldPro;
