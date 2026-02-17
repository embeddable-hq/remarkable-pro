import { DataResponse, Dimension } from '@embeddable.com/core';
import { getThemeFormatter } from '../../../theme/formatter/formatter.utils';
import { useTheme } from '@embeddable.com/react';
import { Theme } from '../../../theme/theme.types';
import { EditorCard, EditorCardHeaderProps } from '../shared/EditorCard/EditorCard';
import { resolveI18nProps } from '../../component.utils';
import { i18n } from '../../../theme/i18n/i18n';
import { SingleSelectField } from '@embeddable.com/remarkable-ui';

export const MAX_OPTIONS = 200;

export type SingleSelectFieldProProps = {
  dimension: Dimension;
  optionalSecondDimension?: Dimension;
  placeholder?: string;
  results: DataResponse;
  selectedValue?: string;
  maxOptions?: number;
  setSearchValue?: (search: string) => void;
  onChange?: (selectedValue: string) => void;
} & EditorCardHeaderProps;

const SingleSelectFieldPro = (props: SingleSelectFieldProProps) => {
  const theme: Theme = useTheme() as Theme;
  const themeFormatter = getThemeFormatter(theme);

  const { title, description, dimension, placeholder, tooltip } = resolveI18nProps(props);
  const { optionalSecondDimension, results, selectedValue, setSearchValue, onChange } = props;

  const options =
    results.data?.map((data) => {
      return {
        value: optionalSecondDimension ? data[optionalSecondDimension.name] : data[dimension.name],
        label: themeFormatter.data(dimension, data[dimension.name]),
      };
    }) ?? [];

  const showNoOptionsMessage = Boolean(!results.isLoading && (results.data?.length ?? 0) === 0);

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <SingleSelectField
        clearable
        searchable
        isLoading={results.isLoading}
        value={selectedValue}
        options={options}
        placeholder={placeholder}
        noOptionsMessage={showNoOptionsMessage ? i18n.t('common.noOptionsFound') : undefined}
        onChange={(newValue: string) => onChange?.(newValue)}
        onSearch={setSearchValue}
        avoidCollisions={false}
      />
    </EditorCard>
  );
};

export default SingleSelectFieldPro;
