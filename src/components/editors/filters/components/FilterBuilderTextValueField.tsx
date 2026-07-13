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

  const debouncedSelectValue = useDebounce((value: string | null) => {
    onSelectValue(value);
  });

  useEffect(() => {
    debouncedSelectValue(value || null);
  }, [value, debouncedSelectValue]);

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
