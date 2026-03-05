import { useCallback, useEffect, useRef, useState } from 'react';
import { TextField, useDebounce } from '@embeddable.com/remarkable-ui';
import { EditorCard, EditorCardHeaderProps } from '../shared/EditorCard/EditorCard';
import { resolveI18nProps } from '../../component.utils';

export type TextFieldProProps = {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
} & EditorCardHeaderProps;

const TextFieldPro = (props: TextFieldProProps) => {
  const { title, description, tooltip, placeholder = '' } = resolveI18nProps(props);
  const { value: variableValue, onChange } = props;

  const [localValue, setLocalValue] = useState(() => variableValue ?? '');
  const lastEmittedValueRef = useRef<string | undefined>(variableValue ?? '');
  const latestLocalValueRef = useRef(localValue);

  const debouncedOnChange = useDebounce((value: string) => {
    if (latestLocalValueRef.current !== value) return;
    lastEmittedValueRef.current = value;
    onChange?.(value);
  });

  useEffect(() => {
    const externalValue = variableValue ?? '';
    if (externalValue !== lastEmittedValueRef.current) {
      lastEmittedValueRef.current = externalValue;
      latestLocalValueRef.current = externalValue;
      setLocalValue(externalValue);
    }
  }, [variableValue]);

  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);
      latestLocalValueRef.current = newValue;
      if (newValue === '') {
        lastEmittedValueRef.current = '';
        onChange?.('');
      } else {
        debouncedOnChange(newValue);
      }
    },
    [onChange, debouncedOnChange],
  );

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <TextField value={localValue} placeholder={placeholder} onChange={handleChange} clearable />
    </EditorCard>
  );
};

export default TextFieldPro;
