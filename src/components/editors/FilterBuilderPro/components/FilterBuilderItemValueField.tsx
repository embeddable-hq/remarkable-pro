import { DataResponse, DimensionOrMeasure, NativeDataType } from '@embeddable.com/core';
import { FilterBuilderFilter } from '../definition';
import { MultiSelectField, SingleSelectField } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../../theme/theme.types';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { i18n } from '../../../../theme/i18n/i18n';
import FilterBuilderItemNumberValueField from './FilterBuilderItemNumberValueField';
import FilterBuilderTextValueField from './FilterBuilderTextValueField';
import styles from '../FilterBuilderPro.module.css';
import { IconLoader2, IconX } from '@tabler/icons-react';
import { operatorStringBoolean } from '../FilterBuilderPro.utils';
import clsx from 'clsx';
import { useRef } from 'react';

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
  const labelCache = useRef<Record<string, string>>({});

  const rawOptions =
    results?.data?.map((data) => ({
      value: data[dimensionOrMeasure.name],
      label: themeFormatter.data(dimensionOrMeasure, data[dimensionOrMeasure.name]),
    })) ?? [];

  // Accumulate labels as options arrive. When a search is active, results are limited and
  // previously selected values may no longer be present — the cache lets us still display
  // their labels correctly.
  rawOptions.forEach(({ value, label }) => {
    if (value != null) labelCache.current[value] = label;
  });

  const getLabel = (value: string) => labelCache.current[value] ?? value;

  let selectedValues: string[];
  if (Array.isArray(filter.value)) {
    selectedValues = filter.value as string[];
  } else if (filter.value === null || filter.value === undefined) {
    selectedValues = [];
  } else {
    selectedValues = [filter.value as string];
  }

  const options = [
    ...rawOptions.filter((o) => selectedValues.includes(o.value)),
    ...rawOptions.filter((o) => !selectedValues.includes(o.value)),
  ];

  const isLoading = results?.isLoading;
  const showNoOptionsMessage = Boolean(!isLoading && (results?.data?.length ?? 0) === 0);

  const isNumberField = dimensionOrMeasure.nativeType === NativeDataType.number;

  if (isNumberField) {
    return <FilterBuilderItemNumberValueField filter={filter} onSelectValue={onSelectValue} />;
  }

  const isTextField =
    dimensionOrMeasure.nativeType === NativeDataType.string &&
    filter.operator === operatorStringBoolean.contains;

  if (isTextField) {
    return <FilterBuilderTextValueField filter={filter} onSelectValue={onSelectValue} />;
  }

  const isMultiSelectField =
    filter.operator === operatorStringBoolean.isOneOf ||
    filter.operator === operatorStringBoolean.isNotOneOf;

  const hasValue = filter.value != null;
  const showClearIcon = !isLoading && hasValue;

  if (isMultiSelectField) {
    const filterValue = (filter.value as string[]) ?? [];

    let displayValue: string;
    if (filterValue.length === 0) {
      displayValue = '...';
    } else if (filterValue.length > 2) {
      displayValue = `${filterValue.length} selected`;
    } else {
      displayValue = filterValue.map(getLabel).join(', ');
    }

    return (
      <MultiSelectField
        triggerComponent={
          <button className={clsx(styles.valueButton, !hasValue && styles.valueButtonEmpty)}>
            {isLoading ? <IconLoader2 className={styles.loadingSpinner} /> : displayValue}
            {showClearIcon && <IconX onClick={() => onSelectValue(null)} />}
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
    filter.operator === operatorStringBoolean.is || filter.operator === operatorStringBoolean.isNot;

  if (isSingleSelectField) {
    const displayValue = filter.value != null ? getLabel(filter.value as string) : '...';

    return (
      <SingleSelectField
        triggerComponent={
          <button className={clsx(styles.valueButton, !hasValue && styles.valueButtonEmpty)}>
            {isLoading ? <IconLoader2 className={styles.loadingSpinner} /> : displayValue}
            {showClearIcon && <IconX onClick={() => onSelectValue(null)} />}
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
