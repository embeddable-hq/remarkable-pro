import { useEffect, useState } from 'react';
import { FilterBuilderFilter } from './definition';
import { NumberField } from '@embeddable.com/remarkable-ui';
import styles from './FilterBuilderPro.module.css';
import clsx from 'clsx';
import { i18n } from '../../../theme/i18n/i18n';

export type FilterBuilderItemNumberValueFieldProps = {
  filter: FilterBuilderFilter;
  onSelectValue: (value: number | number[] | null) => void;
};

const FilterBuilderItemNumberValueField = ({
  filter,
  onSelectValue,
}: FilterBuilderItemNumberValueFieldProps) => {
  const [min, setMin] = useState<number | null>(null);
  const [max, setMax] = useState<number | null>(null);

  // TODO: check with denis and harry if the between can work with only 1 value (min or max)
  useEffect(() => {
    if (min != null && max != null) {
      onSelectValue([min, max]);
    }
  }, [min, max]);

  if (filter.operator === 'between') {
    return (
      <>
        {/* TODO: ask denis */}
        <input
          type="number"
          className={styles.filterInput}
          value={min ?? ''}
          onChange={(e) => setMin(e.target.value === '' ? null : Number(e.target.value))}
        />
        <button className={clsx(styles.filterButton, styles.filterButtonOperator)}>
          {i18n.t('filterBuilderPro.betweenAnd')}
        </button>
        <input
          type="number"
          className={styles.filterInput}
          value={max ?? ''}
          onChange={(e) => setMax(e.target.value === '' ? null : Number(e.target.value))}
        />
      </>
    );
  }

  return (
    <input
      type="number"
      className={styles.filterInput}
      value={filter.value == null ? '' : (filter.value as number)}
      onChange={(v) => onSelectValue(v.target.value === '' ? null : Number(v.target.value))}
      // clearable
    />
  );
};

export default FilterBuilderItemNumberValueField;
