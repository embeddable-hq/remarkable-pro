import { Measure } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import { MultiSelectField } from '@embeddable.com/remarkable-ui';
import { useState } from 'react';
import { Theme } from '../../../theme/theme.types';
import { i18nSetup, i18n } from '../../../theme/i18n/i18n';
import { EditorCard, EditorCardHeaderProps } from '../shared/EditorCard/EditorCard';
import { resolveI18nProps } from '../../component.utils';
import { getDimensionAndMeasureOptions } from '../utils/dimensionsAndMeasures.utils';

export type MeasureMultiSelectFieldProProps = {
  selectedMeasures?: Measure[];
  measureOptions?: Measure[];
  placeholder?: string;
  clearable?: boolean;
  onChange: (value: Measure[]) => void;
} & EditorCardHeaderProps;

const MeasureMultiSelectFieldPro = (props: MeasureMultiSelectFieldProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const { selectedMeasures = [], measureOptions = [], clearable, onChange } = props;
  const { title, description, tooltip, placeholder } = resolveI18nProps(props);

  const [searchValue, setSearchValue] = useState('');

  const currentMeasureName = selectedMeasures.map((m) => m.name);

  const options = getDimensionAndMeasureOptions({
    dimensionsAndMeasures: measureOptions,
    searchValue,
    theme,
  });

  const handleChange = (newValues: string[]) => {
    const selectedNamesSet = new Set(newValues);
    onChange(measureOptions.filter((m) => selectedNamesSet.has(m.name)));
  };

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <MultiSelectField
        isClearable={clearable}
        isSearchable
        values={currentMeasureName}
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

export default MeasureMultiSelectFieldPro;
