import {
  DataResponse,
  DimensionOrMeasure,
  FilterOperator,
  NativeDataType,
} from '@embeddable.com/core';
import { FilterBuilderFilter } from '../definition';
import { SingleSelectField } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../../theme/theme.types';
import FilterBuilderItemValueField from './FilterBuilderItemValueField';
import { useEffect } from 'react';
import styles from '../FilterBuilderPro.module.css';

const OPERATORS_STRING_BOOLEAN = [
  { value: FilterOperator.equals, label: 'is' },
  { value: FilterOperator.notEquals, label: 'is not' },
  { value: FilterOperator.contains, label: 'includes' },
  { value: FilterOperator.notContains, label: 'does not include' },
];

const OPERATORS_NUMBER = [
  { value: FilterOperator.equals, label: 'Equals' },
  { value: FilterOperator.notEquals, label: 'Does not equal' },
  { value: FilterOperator.gte, label: 'Greater than or equal to' },
  { value: FilterOperator.lte, label: 'Less than or equal to' },
  { value: 'between', label: 'Between' },
];

type FilterBuilderItemOperatorValueFieldsProps = {
  dimensionOrMeasure: DimensionOrMeasure;
  filter: FilterBuilderFilter;
  results?: DataResponse;
  theme: Theme;
  onSelectOperator: (value: string | null) => void;
  onSelectValue: (value: FilterBuilderFilter['value']) => void;
  onSearchValue: (value: string) => void;
};

const FilterBuilderItemOperatorValueFields = ({
  dimensionOrMeasure,
  filter,
  results,
  theme,
  onSelectOperator,
  onSelectValue,
  onSearchValue,
}: FilterBuilderItemOperatorValueFieldsProps) => {
  const operatorOptions =
    dimensionOrMeasure.nativeType === NativeDataType.number
      ? OPERATORS_NUMBER
      : OPERATORS_STRING_BOOLEAN;

  useEffect(() => {
    if (!filter.operator) {
      onSelectOperator(operatorOptions[0]!.value);
    }
  });

  return (
    <>
      <SingleSelectField
        triggerComponent={
          <button className={styles.operatorButton}>
            {operatorOptions.find((x) => x.value === filter.operator)?.label}
          </button>
        }
        value={filter.operator}
        options={operatorOptions}
        onChange={onSelectOperator}
        avoidCollisions={false}
      />
      <FilterBuilderItemValueField
        filter={filter}
        dimensionOrMeasure={dimensionOrMeasure}
        results={results}
        theme={theme}
        onSelectValue={onSelectValue}
        onSearchValue={onSearchValue}
      />
    </>
  );
};

export default FilterBuilderItemOperatorValueFields;
