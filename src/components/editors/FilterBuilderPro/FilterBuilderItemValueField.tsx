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
import clsx from 'clsx';

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

  const showNoOptionsMessage = Boolean(!results?.isLoading && (results?.data?.length ?? 0) === 0);

  if (dimensionOrMeasure.nativeType === NativeDataType.number) {
    return <FilterBuilderItemNumberValueField filter={filter} onSelectValue={onSelectValue} />;
  }

  if (
    filter.operator === FilterOperator.contains ||
    filter.operator === FilterOperator.notContains
  ) {
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
          <button className={clsx(styles.filterButton, styles.filterButtonValue)}>
            {displayValue}
          </button>
        }
        isSearchable
        isClearable
        isLoading={results?.isLoading}
        values={filterValue}
        options={options}
        onChange={(newValue) => onSelectValue(newValue.length === 0 ? null : newValue)}
        onSearch={onSearchValue}
        avoidCollisions={false}
        noOptionsMessage={showNoOptionsMessage ? i18n.t('common.noOptionsFound') : undefined}
      />
    );
  }

  if (filter.operator === FilterOperator.equals || filter.operator === FilterOperator.notEquals) {
    const displayValue = options.find((option) => option.value === filter.value)?.label ?? '...';

    return (
      <SingleSelectField
        triggerComponent={
          <button className={clsx(styles.filterButton, styles.filterButtonValue)}>
            {displayValue}
          </button>
        }
        searchable
        clearable
        isLoading={results?.isLoading}
        value={filter.value as string}
        options={options}
        onChange={(newValue) => onSelectValue(newValue === '' ? null : newValue)}
        onSearch={onSearchValue}
        avoidCollisions={false}
        noOptionsMessage={showNoOptionsMessage ? i18n.t('common.noOptionsFound') : undefined}
      />
    );
  }

  return null;
};

export default FilterBuilderItemValueField;
