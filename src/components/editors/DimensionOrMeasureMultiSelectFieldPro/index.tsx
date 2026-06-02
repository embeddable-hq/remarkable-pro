import { DimensionOrMeasure } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import { MultiSelectField } from '@embeddable.com/remarkable-ui';
import { useState, useEffect } from 'react';
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
  const [pendingValues, setPendingValues] = useState<string[]>([]);

  useEffect(() => {
    if (clearable) return;
    if (selectedDimensionsAndMeasures.length > 0) return;
    const first = dimensionAndMeasureOptions[0];
    if (!first) return;

    onChange([first]);
  }, [clearable, selectedDimensionsAndMeasures.length, dimensionAndMeasureOptions, onChange]);

  // Normalize selectedDimensionsAndMeasures titles by resolving them against dimensionAndMeasureOptions.
  // Variable defaults may store items with model-qualified titles (e.g. "Products # of orders"),
  // while dimensionAndMeasureOptions always has the correct display title (e.g. "# of orders").
  // Firing onChange with the resolved objects ensures the variable and any dependent
  // components (e.g. charts) receive correctly-formatted measures/dimensions.
  useEffect(() => {
    if (!selectedDimensionsAndMeasures.length || !dimensionAndMeasureOptions.length) return;

    const normalized = selectedDimensionsAndMeasures.map(
      (d) => dimensionAndMeasureOptions.find((o) => o.name === d.name) ?? d,
    );

    if (normalized.every((norm, i) => norm.title === selectedDimensionsAndMeasures[i]?.title))
      return;

    onChange(normalized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(selectedDimensionsAndMeasures.map((d) => `${d.name}:${d.title}`)),
    JSON.stringify(dimensionAndMeasureOptions.map((d) => `${d.name}:${d.title}`)),
    onChange,
  ]);

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
        disableApplyButton={!clearable && pendingValues.length === 0}
        isSearchable
        values={currentDimensionAndMeasureNames}
        options={options}
        placeholder={placeholder}
        noOptionsMessage={i18n.t('common.noOptionsFound')}
        onChange={handleChange}
        onPendingChange={setPendingValues}
        onSearch={setSearchValue}
        avoidCollisions={false}
      />
    </EditorCard>
  );
};

export default DimensionMeasureMultiSelectFieldPro;
