import {
  DataResponse,
  DimensionOrMeasure,
  FilterOperator,
  NativeDataType,
} from '@embeddable.com/core';
import { FilterBuilderFilter } from './definition';
import { MultiSelectField, SingleSelectField } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../theme/theme.types';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { i18n } from '../../../theme/i18n/i18n';
import FilterBuilderItemNumberValueField from './FilterBuilderItemNumberValueField';
import styles from './FilterBuilderPro.module.css';
import { IconLoader2 } from '@tabler/icons-react';

export type FilterBuilderItemValueFieldProps = {
  filter: FilterBuilderFilter;
  dimensionOrMeasure: DimensionOrMeasure;
  results?: DataResponse;
  theme: Theme;
  onSelectValue: (value: string | string[] | number | number[] | null) => void;
  onSearchValue: (value: string) => void;
};

const FilterBuilderItemValueField = ({
  filter,
  dimensionOrMeasure,
  results,
  theme,
  onSelectValue,
  onSearchValue,
}: FilterBuilderItemValueFieldProps) => {
  const themeFormatter = getThemeFormatter(theme);

  const options =
    results?.data?.map((data) => ({
      value: data[dimensionOrMeasure.name],
      label: themeFormatter.data(dimensionOrMeasure, data[dimensionOrMeasure.name]),
    })) ?? [];

  const isLoading = results?.isLoading;
  const showNoOptionsMessage = Boolean(!isLoading && (results?.data?.length ?? 0) === 0);

  const isNumberField = dimensionOrMeasure.nativeType === NativeDataType.number;

  if (isNumberField) {
    return <FilterBuilderItemNumberValueField filter={filter} onSelectValue={onSelectValue} />;
  }

  const isMultiSelectField =
    filter.operator === FilterOperator.contains || filter.operator === FilterOperator.notContains;

  if (isMultiSelectField) {
    const filterValue = (filter.value as string[]) ?? [];
    const selectedValues = options.filter((option) => filterValue.includes(option.value));

    let displayValue: string;
    if (selectedValues.length === 0) {
      displayValue = '...';
    } else if (selectedValues.length > 2) {
      displayValue = `${selectedValues.length} selected`;
    } else {
      displayValue = selectedValues.map((o) => o.label).join(', ');
    }

    return (
      <MultiSelectField
        triggerComponent={
          <button className={styles.valueButton}>
            {isLoading ? <IconLoader2 className={styles.loadingSpinner} /> : displayValue}
          </button>
        }
        isSearchable
        isClearable
        isLoading={isLoading}
        values={filterValue}
        options={options}
        onChange={(newValue) => onSelectValue(newValue.length === 0 ? null : newValue)}
        onSearch={onSearchValue}
        avoidCollisions={false}
        noOptionsMessage={showNoOptionsMessage ? i18n.t('common.noOptionsFound') : undefined}
      />
    );
  }
  const isSingleSelectField =
    filter.operator === FilterOperator.equals || filter.operator === FilterOperator.notEquals;

  if (isSingleSelectField) {
    const displayValue = options.find((option) => option.value === filter.value)?.label ?? '...';

    return (
      <SingleSelectField
        triggerComponent={
          <button className={styles.valueButton}>
            {isLoading ? <IconLoader2 className={styles.loadingSpinner} /> : displayValue}
          </button>
        }
        searchable
        clearable
        isLoading={isLoading}
        value={filter.value as string}
        options={options}
        onChange={onSelectValue}
        onSearch={onSearchValue}
        avoidCollisions={false}
        noOptionsMessage={showNoOptionsMessage ? i18n.t('common.noOptionsFound') : undefined}
      />
    );
  }

  return null;
};

export default FilterBuilderItemValueField;
