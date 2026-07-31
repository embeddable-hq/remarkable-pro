import { useEffect, useRef, useState } from 'react';
import { useDebounce } from '@embeddable.com/remarkable-ui';
import { FilterBuilderFilter } from '../filters.utils';
import { CssModuleClasses } from '../../../../types/css-modules';

export type FilterBuilderTextValueFieldProps = {
  filter: FilterBuilderFilter;
  onSelectValue: (value: string | null) => void;
  styles: CssModuleClasses;
};

const FilterBuilderTextValueField = ({
  filter,
  onSelectValue,
  styles,
}: FilterBuilderTextValueFieldProps) => {
  const [value, setValue] = useState<string>((filter?.value as string) ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  // Tracks the value we last emitted, so the external-sync effect below can tell
  // a genuine host-driven change apart from the echo of our own debounced emit.
  const lastEmittedRef = useRef<string | null>((filter?.value as string) ?? null);

  const debouncedSelectValue = useDebounce((value: string | null) => {
    lastEmittedRef.current = value;
    onSelectValue(value);
  });

  useEffect(() => {
    debouncedSelectValue(value || null);
  }, [value, debouncedSelectValue]);

  // Adopt host-driven changes to filter.value (e.g. an updated/reset defaultFilters)
  // into local state, ignoring the echo of our own emit so typing isn't disrupted.
  useEffect(() => {
    const incoming = (filter?.value as string) ?? null;
    if (incoming === lastEmittedRef.current) return;
    lastEmittedRef.current = incoming;
    setValue(incoming ?? '');
  }, [filter.value]);

  useEffect(() => {
    if (filter.value) return;

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [filter.value, filter.operator]);

  return (
    <input
      ref={inputRef}
      type="text"
      className={styles.valueInput}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};

export default FilterBuilderTextValueField;
