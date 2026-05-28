import { useEffect, useRef, useState } from 'react';
import { useDebounce } from '@embeddable.com/remarkable-ui';
import { FilterBuilderFilter } from '../definition';
import styles from '../FilterBuilderPro.module.css';

export type FilterBuilderTextValueFieldProps = {
  filter: FilterBuilderFilter;
  onSelectValue: (value: string | null) => void;
};

const FilterBuilderTextValueField = ({
  filter,
  onSelectValue,
}: FilterBuilderTextValueFieldProps) => {
  const [value, setValue] = useState<string>((filter?.value as string) ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSelectValue = useDebounce((value: string | null) => {
    onSelectValue(value);
  });

  useEffect(() => {
    debouncedSelectValue(value || null);
  }, [value, debouncedSelectValue]);

  useEffect(() => {
    // Don't auto-focus if the field already has a value — this means it was restored
    // from saved state (e.g. page reload), not freshly selected by the user.
    if (filter.value != null) return;
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [filter.operator]);

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
