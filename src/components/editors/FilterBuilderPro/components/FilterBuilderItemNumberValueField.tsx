import React, { useEffect, useRef, useState } from 'react';
import { useDebounce } from '@embeddable.com/remarkable-ui';
import { FilterBuilderFilter } from '../definition';
import styles from '../FilterBuilderPro.module.css';
import { i18n } from '../../../../theme/i18n/i18n';

export type FilterBuilderItemNumberValueFieldProps = {
  filter: FilterBuilderFilter;
  onSelectValue: (value: number | number[] | null) => void;
};

const getOnChangeValue = (v: React.ChangeEvent<HTMLInputElement>) => {
  return v.target.value === '' ? null : Number(v.target.value);
};

const FilterBuilderItemNumberValueField = ({
  filter,
  onSelectValue,
}: FilterBuilderItemNumberValueFieldProps) => {
  const [value, setValue] = useState<number | null>((filter?.value as number) ?? null);
  const [min, setMin] = useState<number | null>(
    Array.isArray(filter.value) ? ((filter.value as number[])[0] ?? null) : null,
  );
  const [max, setMax] = useState<number | null>(
    Array.isArray(filter.value) ? ((filter.value as number[])[1] ?? null) : null,
  );
  const firstInputRef = useRef<HTMLInputElement>(null);

  const debouncedSelectValue = useDebounce((value: number | number[] | null) => {
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
