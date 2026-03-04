import { useCallback, useEffect, useRef, useState } from 'react';
import { TextField, useDebounce } from '@embeddable.com/remarkable-ui';
import { EditorCard } from '../shared/EditorCard/EditorCard';
import { resolveI18nProps } from '../../component.utils';
import { EditorCardHeaderProps } from '../shared/EditorCard/EditorCard';

const DEBOUNCE_MS = 350;

export type TextFieldProProps = {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
} & EditorCardHeaderProps;

const TextFieldPro = (props: TextFieldProProps) => {
  const { title, description, tooltip } = resolveI18nProps(props);
  const { value: variableValue, placeholder, onChange } = props;

  const [localValue, setLocalValue] = useState(() => variableValue ?? '');
  const lastEmittedValueRef = useRef<string | undefined>(variableValue ?? '');
  const latestLocalValueRef = useRef(localValue);
  latestLocalValueRef.current = localValue;

  const debouncedCommit = useDebounce((value: string) => {
    if (latestLocalValueRef.current === value) {
      lastEmittedValueRef.current = value;
      onChange?.(value);
    }
  }, DEBOUNCE_MS);

  useEffect(() => {
    const externalValue = variableValue ?? '';
    if (externalValue !== lastEmittedValueRef.current) {
      lastEmittedValueRef.current = externalValue;
      setLocalValue(externalValue);
    }
  }, [variableValue]);

  useEffect(() => {
    if (localValue === lastEmittedValueRef.current) return;
    if (localValue === '') return;
    debouncedCommit(localValue);
  }, [localValue, debouncedCommit]);

  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);
      if (newValue === '') {
        lastEmittedValueRef.current = '';
        onChange?.('');
      }
    },
    [onChange],
  );

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <TextField
        value={localValue}
        placeholder={placeholder ?? ''}
        onChange={handleChange}
        clearable
      />
    </EditorCard>
  );
};

export default TextFieldPro;
