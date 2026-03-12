import { DimensionOrMeasure, FilterOperator, NativeDataType } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../theme/theme.types';
import { getDimensionAndMeasureOptions } from '../utils/dimensionsAndMeasures.utils';
import { useState } from 'react';
import { SingleSelectField } from '@embeddable.com/remarkable-ui';

// { member: 'customers.count'; nativeDataType: 'number'; operator: 'equals'; value: '1' }

type FilterBuilderItemProps = {
  filter: {
    member: string;
    nativeDataType: NativeDataType;
    operator: FilterOperator;
    value: string;
  };
  dimensionsAndMeasures: DimensionOrMeasure[];
  theme: Theme;
  onChange: (newFilterItem: string) => void;
};

const FilterBuilderItem = (props: FilterBuilderItemProps) => {
  const { dimensionsAndMeasures = [], theme, filter: _filter, onChange: _onChange } = props;

  const [searchValue, setSearchValue] = useState<string>('');

  const dimensionAndMeasureOptions = getDimensionAndMeasureOptions({
    dimensionsAndMeasures,
    searchValue,
    theme,
  });

  const handleChange = (_newValue: string) => {};

  return (
    <div>
      <SingleSelectField
        searchable
        // clearable={clearable}
        // placeholder={placeholder}
        // value={selectedValue?.name}
        onChange={handleChange}
        onSearch={setSearchValue}
        options={dimensionAndMeasureOptions}
        avoidCollisions={false}
      />
    </div>
  );
};

export type FilterBuilderProProps = {
  dimensionsAndMeasures?: DimensionOrMeasure[];
  /* eslint-disable @typescript-eslint/no-explicit-any */
  onApply?: (data: any) => void;
};

const FilterBuilderPro = (props: FilterBuilderProProps) => {
  const theme = useTheme() as Theme;

  const { dimensionsAndMeasures = [], onApply } = props;

  const handleChange = (_newValue: string) => {};

  return (
    <div>
      <FilterBuilderItem
        filter={{
          member: 'customers.count',
          nativeDataType: 'number',
          operator: 'equals',
          value: '1',
        }}
        theme={theme}
        dimensionsAndMeasures={dimensionsAndMeasures}
        onChange={handleChange}
      />
      <button onClick={() => onApply?.([])}>clear all</button>
      <button
        onClick={() => {
          onApply?.([{ member: 'country', operator: 'equals', value: ['Canada'] }]);
        }}
      >
        apply random filter set
      </button>
    </div>
  );
};

export default FilterBuilderPro;
