import { DataResponse, DimensionOrMeasure } from '@embeddable.com/core';
import { FilterBuilderFilter } from '../definition';
import { SingleSelectField } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../../theme/theme.types';
import FilterBuilderItemValueField from './FilterBuilderItemValueField';
import { useEffect } from 'react';
import defaultStyles from '../FilterBuilderPro.module.css';
import { getOperatorOptions } from '../FilterBuilderPro.utils';

type FilterBuilderItemOperatorValueFieldsProps = {
  dimensionOrMeasure: DimensionOrMeasure;
  filter: FilterBuilderFilter;
  results?: DataResponse;
  theme: Theme;
  onSelectOperator: (value: string | null) => void;
  onSelectValue: (value: FilterBuilderFilter['value']) => void;
  onSearchValue: (value: string) => void;
  styles?: Record<string, string>;
  showInlineClear?: boolean;
};

const FilterBuilderItemOperatorValueFields = ({
  dimensionOrMeasure,
  filter,
  results,
  theme,
  onSelectOperator,
  onSelectValue,
  onSearchValue,
  styles = defaultStyles,
  showInlineClear = true,
}: FilterBuilderItemOperatorValueFieldsProps) => {
  const operatorOptions = getOperatorOptions(dimensionOrMeasure);

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
        styles={styles}
        showInlineClear={showInlineClear}
      />
    </>
  );
};

export default FilterBuilderItemOperatorValueFields;
