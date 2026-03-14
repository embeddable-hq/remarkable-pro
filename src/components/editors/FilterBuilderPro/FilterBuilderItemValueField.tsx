import { DataResponse, DimensionOrMeasure, FilterOperator, NativeDataType } from '@embeddable.com/core';
import { FilterBuilderFilter } from './definition';
import { MultiSelectField, SingleSelectField } from '@embeddable.com/remarkable-ui';
import { Theme } from '../../../theme/theme.types';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { i18n } from '../../../theme/i18n/i18n';
import FilterBuilderItemNumberValueField from './FilterBuilderItemNumberValueField';

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
    return (
      <FilterBuilderItemNumberValueField
        filter={filter}
        onSelectValue={onSelectValue}
      />
    );
  }

  if (filter.operator === FilterOperator.contains || filter.operator === FilterOperator.notContains) {
    return (
      <MultiSelectField
        isSearchable
        isClearable
        isLoading={results?.isLoading}
        values={(filter.value as string[]) ?? []}
        options={options}
        onChange={(newValue) => onSelectValue(newValue.length === 0 ? null : newValue)}
        onSearch={onSearchValue}
        avoidCollisions={false}
        noOptionsMessage={showNoOptionsMessage ? i18n.t('common.noOptionsFound') : undefined}
      />
    );
  }

  if (filter.operator === FilterOperator.equals || filter.operator === FilterOperator.notEquals) {
    return (
      <SingleSelectField
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
