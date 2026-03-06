import { DimensionOrMeasure } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import { MultiSelectField } from '@embeddable.com/remarkable-ui';
import { useState } from 'react';
import { Theme } from '../../../theme/theme.types';
import { i18nSetup } from '../../../theme/i18n/i18n';
import { i18n } from '../../../theme/i18n/i18n';
import { EditorCard, EditorCardHeaderProps } from '../shared/EditorCard/EditorCard';
import { resolveI18nProps } from '../../component.utils';
import { getDimensionAndMeasureOptions } from '../utils/dimensionsAndMeasures.utils';

export type DimensionMeasureMultiSelectFieldProProps = {
  selectedDimensionsAndMeasures?: DimensionOrMeasure[];
  dimensionsAndMeasures: DimensionOrMeasure[];
  placeholder?: string;
  clearable?: boolean;
  onChange: (value: DimensionOrMeasure[]) => void;
} & EditorCardHeaderProps;

export type DimensionOrMeasureMultiSelectFieldProProps = DimensionMeasureMultiSelectFieldProProps;

const DimensionMeasureMultiSelectFieldPro = (props: DimensionMeasureMultiSelectFieldProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const { selectedDimensionsAndMeasures, dimensionsAndMeasures, clearable, onChange } = props;
  const { title, description, tooltip, placeholder } = resolveI18nProps(props);

  const [searchValue, setSearchValue] = useState('');

  const selectedNames = selectedDimensionsAndMeasures?.map((d) => d.name) ?? [];

  const options = getDimensionAndMeasureOptions({
    dimensionsAndMeasures,
    searchValue,
    theme,
  });

  const showNoOptionsMessage = dimensionsAndMeasures.length === 0;

  const handleChange = (newValues: string[]) => {
    const newSelection = newValues
      .map((name) => dimensionsAndMeasures.find((opt) => opt.name === name))
      .filter((v): v is DimensionOrMeasure => v != null);
    onChange(newSelection);
  };

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <MultiSelectField
        isClearable={clearable}
        isSearchable
        values={selectedNames}
        options={options}
        placeholder={placeholder}
        noOptionsMessage={showNoOptionsMessage ? i18n.t('common.noOptionsFound') : undefined}
        onChange={handleChange}
        onSearch={setSearchValue}
        avoidCollisions={false}
      />
    </EditorCard>
  );
};

export default DimensionMeasureMultiSelectFieldPro;
