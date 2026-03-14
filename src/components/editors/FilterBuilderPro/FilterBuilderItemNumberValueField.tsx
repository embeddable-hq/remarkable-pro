import { useEffect, useState } from 'react';
import { FilterBuilderFilter } from './definition';
import { NumberField } from '@embeddable.com/remarkable-ui';

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
        <NumberField value={min} onChange={setMin} />
        <NumberField value={max} onChange={setMax} />
      </>
    );
  }

  return (
    <NumberField
      value={filter.value == null ? null : (filter.value as number)}
      onChange={(v) => onSelectValue(v)}
      clearable
    />
  );
};

export default FilterBuilderItemNumberValueField;
