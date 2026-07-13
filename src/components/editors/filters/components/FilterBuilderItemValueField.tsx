import { DataResponse, DimensionOrMeasure, NativeDataType } from '@embeddable.com/core';
import { MultiSelectField, SingleSelectField } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../../theme/theme.types';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { i18n } from '../../../../theme/i18n/i18n';
import FilterBuilderItemNumberValueField from './FilterBuilderItemNumberValueField';
import FilterBuilderTextValueField from './FilterBuilderTextValueField';
import { IconLoader2, IconX } from '@tabler/icons-react';
import {
  FilterBuilderFilter,
  normalizeSelectedValues,
  operatorStringBoolean,
  sortOptionsWithSelectedFirst,
  getMultiSelectDisplayValue,
} from '../filters.utils';
import { CssModuleClasses } from '../../../../types/css-modules';
import clsx from 'clsx';
import { useRef } from 'react';

type ValueTriggerButtonProps = {
  hasValue: boolean;
  isLoading: boolean | undefined;
  displayValue: string;
  onClear?: () => void;
  styles: CssModuleClasses;
};

const ValueTriggerButton = ({
  hasValue,
  isLoading,
  displayValue,
  onClear,
  styles,
  ...props
}: ValueTriggerButtonProps) => (
  <button className={clsx(styles.valueButton, !hasValue && styles.valueButtonEmpty)} {...props}>
    {isLoading ? <IconLoader2 className={styles.loadingSpinner} /> : displayValue}
    {onClear && <IconX onClick={onClear} />}
  </button>
);

export type FilterBuilderItemValueFieldProps = {
  filter: FilterBuilderFilter;
  dimensionOrMeasure: DimensionOrMeasure;
  results?: DataResponse;
  theme: Theme;
  onSelectValue: (value: string | string[] | number | number[] | null) => void;
  onSearchValue: (value: string) => void;
  styles: CssModuleClasses;
  showClear?: boolean;
};

const FilterBuilderItemValueField = ({
  filter,
  dimensionOrMeasure,
  results,
  theme,
  onSelectValue,
  onSearchValue,
  styles,
  showClear = true,
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

  const selectedValues = normalizeSelectedValues(filter.value);

  const options = sortOptionsWithSelectedFirst(rawOptions, selectedValues);

  const isLoading = results?.isLoading;
  const showNoOptionsMessage = Boolean(!isLoading && (results?.data?.length ?? 0) === 0);

  const isNumberField = dimensionOrMeasure.nativeType === NativeDataType.number;

  if (isNumberField) {
    return (
      <FilterBuilderItemNumberValueField
        filter={filter}
        onSelectValue={onSelectValue}
        styles={styles}
      />
    );
  }

  const isTextField =
    dimensionOrMeasure.nativeType === NativeDataType.string &&
    filter.operator === operatorStringBoolean.contains;

  if (isTextField) {
    return (
      <FilterBuilderTextValueField filter={filter} onSelectValue={onSelectValue} styles={styles} />
    );
  }

  const isMultiSelectField =
    filter.operator === operatorStringBoolean.isOneOf ||
    filter.operator === operatorStringBoolean.isNotOneOf;

  const hasValue = filter.value != null;
  const canClear = showClear && !isLoading && hasValue;

  if (isMultiSelectField) {
    const filterValue = (filter.value as string[]) ?? [];

    const displayValue = getMultiSelectDisplayValue(filterValue, getLabel);

    return (
      <MultiSelectField
        triggerComponent={
          <ValueTriggerButton
            hasValue={hasValue}
            isLoading={isLoading}
            displayValue={displayValue}
            onClear={canClear ? () => onSelectValue(null) : undefined}
            styles={styles}
          />
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
          <ValueTriggerButton
            hasValue={hasValue}
            isLoading={isLoading}
            displayValue={displayValue}
            onClear={canClear ? () => onSelectValue(null) : undefined}
            styles={styles}
          />
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
