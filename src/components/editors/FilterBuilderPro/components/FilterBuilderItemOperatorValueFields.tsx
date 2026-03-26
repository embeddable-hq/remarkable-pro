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
import { i18n } from '../../../../theme/i18n/i18n';

const getOperatorsStringBoolean = () => [
  { value: FilterOperator.equals, label: i18n.t('editors.filterBuilder.is') },
  { value: FilterOperator.notEquals, label: i18n.t('editors.filterBuilder.isNot') },
  { value: FilterOperator.contains, label: i18n.t('editors.filterBuilder.isOneOf') },
  { value: FilterOperator.notContains, label: i18n.t('editors.filterBuilder.isNotOneOf') },
];

const getOperatorsNumber = () => [
  { value: FilterOperator.equals, label: i18n.t('editors.filterBuilder.equals') },
  { value: FilterOperator.notEquals, label: i18n.t('editors.filterBuilder.doesNotEqual') },
  { value: FilterOperator.gte, label: i18n.t('editors.filterBuilder.greaterThanOrEqualTo') },
  { value: FilterOperator.lte, label: i18n.t('editors.filterBuilder.lessThanOrEqualTo') },
  { value: 'between', label: i18n.t('editors.filterBuilder.between') },
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
      ? getOperatorsNumber()
      : getOperatorsStringBoolean();

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
