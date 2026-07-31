import React, { useEffect, useRef, useState } from 'react';
import { useDebounce } from '@embeddable.com/remarkable-ui';
import { FilterBuilderFilter } from '../filters.utils';
import { i18n } from '../../../../theme/i18n/i18n';
import { CssModuleClasses } from '../../../../types/css-modules';

export type FilterBuilderItemNumberValueFieldProps = {
  filter: FilterBuilderFilter;
  onSelectValue: (value: number | number[] | null) => void;
  styles: CssModuleClasses;
};

const getOnChangeValue = (v: React.ChangeEvent<HTMLInputElement>) => {
  return v.target.value === '' ? null : Number(v.target.value);
};

const FilterBuilderItemNumberValueField = ({
  filter,
  onSelectValue,
  styles,
}: FilterBuilderItemNumberValueFieldProps) => {
  const [value, setValue] = useState<number | null>((filter?.value as number) ?? null);
  const [min, setMin] = useState<number | null>(
    Array.isArray(filter.value) ? ((filter.value as number[])[0] ?? null) : null,
  );
  const [max, setMax] = useState<number | null>(
    Array.isArray(filter.value) ? ((filter.value as number[])[1] ?? null) : null,
  );
  const firstInputRef = useRef<HTMLInputElement>(null);
  // Tracks the value we last emitted, so the external-sync effect below can tell
  // a genuine host-driven change apart from the echo of our own debounced emit.
  const lastEmittedRef = useRef<number | number[] | null>(
    (filter?.value as number | number[]) ?? null,
  );

  const debouncedSelectValue = useDebounce((value: number | number[] | null) => {
    lastEmittedRef.current = value;
    onSelectValue(value);
  });

  useEffect(() => {
    if (min != null && max != null) {
      debouncedSelectValue([min, max]);
    }
  }, [min, max, debouncedSelectValue]);

  useEffect(() => {
    if (value != null) {
      debouncedSelectValue(value);
    }
  }, [value, debouncedSelectValue]);

  // Adopt host-driven changes to filter.value (e.g. an updated/reset defaultFilters)
  // into local state, ignoring the echo of our own emit so typing isn't disrupted.
  useEffect(() => {
    const incoming = (filter?.value ?? null) as number | number[] | null;
    if (JSON.stringify(incoming) === JSON.stringify(lastEmittedRef.current)) return;
    lastEmittedRef.current = incoming;
    if (Array.isArray(incoming)) {
      setMin(incoming[0] ?? null);
      setMax(incoming[1] ?? null);
    } else {
      setValue(incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filter?.value ?? null)]);

  useEffect(() => {
    if (filter.value) return;

    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);
  }, [filter.value, filter.operator]);

  if (filter.operator === 'between') {
    return (
      <>
        <input
          ref={firstInputRef}
          type="number"
          className={styles.valueInput}
          value={min ?? ''}
          onChange={(e) => setMin(getOnChangeValue(e))}
        />
        <button disabled className={styles.operatorButton}>
          {i18n.t('editors.filterBuilder.betweenAnd')}
        </button>
        <input
          type="number"
          className={styles.valueInput}
          value={max ?? ''}
          onChange={(e) => setMax(getOnChangeValue(e))}
        />
      </>
    );
  }

  return (
    <input
      ref={firstInputRef}
      type="number"
      className={styles.valueInput}
      value={value ?? ''}
      onChange={(v) => setValue(getOnChangeValue(v))}
    />
  );
};

export default FilterBuilderItemNumberValueField;
