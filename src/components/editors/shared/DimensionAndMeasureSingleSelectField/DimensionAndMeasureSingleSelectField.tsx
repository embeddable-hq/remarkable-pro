import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../../theme/theme.types';
import { useEffect, useState } from 'react';
import { SingleSelectField } from '@embeddable.com/remarkable-ui';
import { getDimensionAndMeasureOptions } from '../../utils/dimensionsAndMeasures.utils';
import { Dimension, Measure } from '@embeddable.com/core';

type DimensionAndMeasureSingleSelectFieldProps<T> = {
  selectedValue?: T;
  options: T[];
  placeholder?: string;
  clearable?: boolean;
  onChange: (value: T | undefined) => void;
};

export const DimensionAndMeasureSingleSelectField = <T extends Dimension | Measure>(
  props: DimensionAndMeasureSingleSelectFieldProps<T>,
) => {
  const theme = useTheme() as Theme;

  const [searchValue, setSearchValue] = useState<string>('');

  const { selectedValue, options, clearable, placeholder, onChange } = props;

  const handleChange = (newValue: string) => {
    const newSelection = options.find((option) => option.name === newValue);
    onChange(newSelection);
  };

  // Auto-select first dimensionOrMeasure when is not clearable and there is no selection
  useEffect(() => {
    const autoSelectActive = !clearable && !selectedValue;

    if (!autoSelectActive) return;

    const firstDimension = options?.[0];

    if (firstDimension) {
      onChange(firstDimension);
    }
  }, [clearable, selectedValue, onChange]);

  return (
    <SingleSelectField
      searchable
      clearable={clearable}
      placeholder={placeholder}
      value={selectedValue?.name}
      onChange={handleChange}
      onSearch={setSearchValue}
      options={getDimensionAndMeasureOptions({
        dimensionsAndMeasures: options,
        searchValue,
        theme,
      })}
      avoidCollisions={false}
    />
  );
};
