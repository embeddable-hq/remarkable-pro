import { useEffect, useMemo, useRef } from 'react';
import { Dimension } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import { SingleSelectField } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../theme/theme.types';
import { i18nSetup } from '../../../theme/i18n/i18n';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { resolveI18nProps } from '../../component.utils';
import { EditorCard } from '../shared/EditorCard/EditorCard';
import { ChartCardHeaderProps } from '../../charts/shared/ChartCard/ChartCard';

type DimensionSelectFieldProProps = {
  dimensions?: Dimension[];
  dimension?: Dimension;
  placeholder?: string;
  clearable?: boolean;
  onChange: (dimension: Dimension | null) => void;
} & ChartCardHeaderProps;

const DimensionSelectFieldPro = (props: DimensionSelectFieldProProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);
  const themeFormatter = getThemeFormatter(theme);

  const { dimensions, dimension, clearable, onChange } = props;
  const { description, placeholder, title } = resolveI18nProps(props);

  const options = useMemo(
    () =>
      dimensions?.map((dim) => ({
        value: dim.name,
        label: themeFormatter.dimensionOrMeasureTitle(dim),
      })) ?? [],
    [dimensions, themeFormatter],
  );

  // Track if we've already auto-selected to prevent repeated triggers
  const hasAutoSelected = useRef(false);

  // Auto-select first dimension once when clearable=false and no default
  useEffect(() => {
    const firstDimension = dimensions?.[0];
    if (!hasAutoSelected.current && !clearable && !dimension && firstDimension) {
      hasAutoSelected.current = true;
      onChange(firstDimension);
    }
  }, [clearable, dimension, dimensions, onChange]);

  // Use the dimension's name directly as the selected value
  const selectedValue = dimension?.name;

  const handleChange = (selectedName: string | null) => {
    if (!selectedName) {
      onChange(null);
      return;
    }
    const found = dimensions?.find((dim) => dim.name === selectedName);
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

export default DimensionSelectFieldPro;
