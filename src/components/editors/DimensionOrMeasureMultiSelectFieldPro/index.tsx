import { DimensionOrMeasure } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import { MultiSelectField } from '@embeddable.com/remarkable-ui';
import { useState } from 'react';
import { Theme } from '../../../theme/theme.types';
import { i18nSetup, i18n } from '../../../theme/i18n/i18n';
import { EditorCard, EditorCardHeaderProps } from '../shared/EditorCard/EditorCard';
import { resolveI18nProps } from '../../component.utils';
import { getDimensionAndMeasureOptions } from '../utils/dimensionsAndMeasures.utils';

export type DimensionMeasureMultiSelectFieldProProps = {
  selectedDimensionsAndMeasures?: DimensionOrMeasure[];
  dimensionAndMeasureOptions?: DimensionOrMeasure[];
  placeholder?: string;
  clearable?: boolean;
  onChange: (value: DimensionOrMeasure[]) => void;
} & EditorCardHeaderProps;

const DimensionMeasureMultiSelectFieldPro = (props: DimensionMeasureMultiSelectFieldProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const {
    selectedDimensionsAndMeasures = [],
    dimensionAndMeasureOptions = [],
    clearable,
    onChange,
  } = props;
  const { title, description, tooltip, placeholder } = resolveI18nProps(props);

  const [searchValue, setSearchValue] = useState('');

  const currentDimensionAndMeasureNames = selectedDimensionsAndMeasures.map((d) => d.name);

  const options = getDimensionAndMeasureOptions({
    dimensionsAndMeasures: dimensionAndMeasureOptions,
    searchValue,
    theme,
  });

  const handleChange = (newValues: string[]) => {
    const selectedNamesSet = new Set(newValues);
    onChange(dimensionAndMeasureOptions.filter((d) => selectedNamesSet.has(d.name)));
  };

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <MultiSelectField
        isClearable={clearable}
        isSearchable
        values={currentDimensionAndMeasureNames}
        options={options}
        placeholder={placeholder}
        noOptionsMessage={i18n.t('common.noOptionsFound')}
        onChange={handleChange}
        onSearch={setSearchValue}
        avoidCollisions={false}
      />
    </EditorCard>
  );
};

export default DimensionMeasureMultiSelectFieldPro;
