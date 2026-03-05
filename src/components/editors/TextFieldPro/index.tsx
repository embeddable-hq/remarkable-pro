import { useEffect, useState } from 'react';
import { TextField, useDebounce } from '@embeddable.com/remarkable-ui';
import { EditorCard, EditorCardHeaderProps } from '../shared/EditorCard/EditorCard';
import { resolveI18nProps } from '../../component.utils';
import { Theme } from '../../../theme/theme.types';
import { useTheme } from '@embeddable.com/react';
import { i18nSetup } from '../../../theme/i18n/i18n';

export type TextFieldProProps = {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
} & EditorCardHeaderProps;

const TextFieldPro = (props: TextFieldProProps) => {
  const theme: Theme = useTheme() as Theme;
  i18nSetup(theme);
  const { title, description, tooltip, placeholder = '' } = resolveI18nProps(props);
  const { value = '', onChange } = props;

  const [currentValue, setCurrentValue] = useState(value);

  const debouncedUpdateState = useDebounce((newValue: string) => {
    onChange?.(newValue);
  });

  useEffect(() => {
    debouncedUpdateState(currentValue);
  }, [currentValue, debouncedUpdateState]);

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <TextField
        value={currentValue}
        placeholder={placeholder}
        onChange={setCurrentValue}
        clearable
      />
    </EditorCard>
  );
};

export default TextFieldPro;
