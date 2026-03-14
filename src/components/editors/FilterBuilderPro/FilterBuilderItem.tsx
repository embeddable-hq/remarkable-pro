import { DataResponse, DimensionOrMeasure, NativeDataType } from '@embeddable.com/core';
import { FilterBuilderFilter } from './definition';
import { SingleSelectField } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../theme/theme.types';
import { getDimensionAndMeasureOptions } from '../utils/dimensionsAndMeasures.utils';
import { useState } from 'react';
import { i18n } from '../../../theme/i18n/i18n';
import FilterBuilderItemOperatorValueFields from './FilterBuilderItemOperatorValueFields';

type FilterBuilderItemProps = {
  filter: FilterBuilderFilter;
  dimensionsAndMeasures: DimensionOrMeasure[];
  results?: DataResponse;
  theme: Theme;
  onSelectDimensionOrMeasure: (value: string) => void;
  onSelectOperator: (value: string) => void;
  onSelectValue: (value: FilterBuilderFilter['value']) => void;
  onSearchValue: (value: string) => void;
};

const SUPPORTED_NATIVE_TYPES: string[] = [
  NativeDataType.string,
  NativeDataType.boolean,
  NativeDataType.number,
];

const FilterBuilderItem = ({
  filter,
  dimensionsAndMeasures,
  results,
  theme,
  onSelectDimensionOrMeasure,
  onSelectOperator,
  onSelectValue,
  onSearchValue,
}: FilterBuilderItemProps) => {
  const { dimensionOrMeasure } = filter;
  const [search, setSearch] = useState('');

  const supportedDimensionsAndMeasures = dimensionsAndMeasures.filter((d) =>
    SUPPORTED_NATIVE_TYPES.includes(d.nativeType),
  );

  const dimensionOptions = getDimensionAndMeasureOptions({
    dimensionsAndMeasures: supportedDimensionsAndMeasures,
    searchValue: search,
    theme,
  });

  const showOperatorValue =
    dimensionOrMeasure !== null && SUPPORTED_NATIVE_TYPES.includes(dimensionOrMeasure.nativeType);

  return (
    <div>
      <SingleSelectField
        searchable
        value={dimensionOrMeasure?.name}
        onChange={onSelectDimensionOrMeasure}
        onSearch={setSearch}
        options={dimensionOptions}
        avoidCollisions={false}
        noOptionsMessage={i18n.t('common.noOptionsFound')}
      />
      {showOperatorValue && (
        <FilterBuilderItemOperatorValueFields
          dimensionOrMeasure={dimensionOrMeasure}
          filter={filter}
          results={results}
          theme={theme}
          onSelectOperator={onSelectOperator}
          onSelectValue={onSelectValue}
          onSearchValue={onSearchValue}
        />
      )}
    </div>
  );
};

export default FilterBuilderItem;
