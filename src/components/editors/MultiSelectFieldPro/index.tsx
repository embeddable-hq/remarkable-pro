import { DataResponse, Dimension } from '@embeddable.com/core';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { useTheme } from '@embeddable.com/react';
import { useEffect } from 'react';
import { Theme } from '../../../theme/theme.types';
import { EditorCard, EditorCardHeaderProps } from '../shared/EditorCard/EditorCard';
import { resolveI18nProps } from '../../component.utils';
import { i18n } from '../../../theme/i18n/i18n';
import { MultiSelectField } from '@embeddable.com/remarkable-ui';
import { dispatchEventUserInteraction } from '../../../utils/events.utils';

export const MAX_OPTIONS = 200;

export type MultiSelectFieldProProps = {
  dimension: Dimension;
  optionalSecondDimension?: Dimension;
  placeholder?: string;
  results: DataResponse;
  selectedValues?: string[];
  maxOptions?: number;
  showSelectAll?: boolean;
  clearable?: boolean;
  componentName?: string;
  trackingId?: string;
  setSearchValue?: (search: string) => void;
  onChange?: (newValues: string[]) => void;
} & EditorCardHeaderProps;

const MultiSelectFieldPro = (props: MultiSelectFieldProProps) => {
  const theme: Theme = useTheme() as Theme;
  const themeFormatter = getThemeFormatter(theme);

  const { tooltip, title, description, placeholder } = resolveI18nProps(props);
  const {
    dimension,
    optionalSecondDimension,
    results,
    selectedValues,
    maxOptions,
    showSelectAll,
    clearable,
    componentName,
    trackingId,
    setSearchValue,
    onChange,
  } = props;

  const options =
    results.data?.map((data) => {
      return {
        value: optionalSecondDimension ? data[optionalSecondDimension.name] : data[dimension.name],
        label: themeFormatter.data(dimension, data[dimension.name]),
      };
    }) ?? [];

  const showNoOptionsMessage = Boolean(!results.isLoading && (results.data?.length ?? 0) === 0);

  // Even when enabled, only offer select/deselect all when every value is loaded: a result
  // set that reaches maxOptions may be truncated by the load limit, so the full list is unknown
  const displaySelectAll = Boolean(
    showSelectAll &&
    typeof maxOptions === 'number' &&
    options.length > 0 &&
    options.length < maxOptions,
  );

  const firstOptionValue = options[0]?.value;

  // Auto-select first option when not clearable and there is no selection
  useEffect(() => {
    if (clearable) return;
    if ((selectedValues?.length ?? 0) > 0) return;
    if (firstOptionValue === undefined) return;

    onChange?.([firstOptionValue]);
  }, [clearable, selectedValues, firstOptionValue, onChange]);

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <MultiSelectField
        isClearable={clearable}
        isSearchable
        isLoading={results.isLoading}
        values={selectedValues ?? []}
        options={options}
        placeholder={placeholder}
        noOptionsMessage={showNoOptionsMessage ? i18n.t('common.noOptionsFound') : undefined}
        showSelectAll={displaySelectAll}
        selectAllLabel={i18n.t('common.selectAll')}
        deselectAllLabel={i18n.t('common.deselectAll')}
        onChange={(newValues) => {
          dispatchEventUserInteraction({ componentName, trackingId, value: newValues });
          onChange?.(newValues);
        }}
        onSearch={setSearchValue}
        avoidCollisions={false}
      />
    </EditorCard>
  );
};

export default MultiSelectFieldPro;
