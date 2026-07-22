import { render, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import FilterBuilderItemNumberValueField from './FilterBuilderItemNumberValueField';
import type { FilterBuilderFilter } from '../filters.utils';

vi.mock('@embeddable.com/remarkable-ui', () => ({
  useDebounce: (fn: (...args: unknown[]) => void) => fn,
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18n: { t: (key: string) => key },
}));

const styles = { valueInput: 'valueInput', operatorButton: 'operatorButton' };

const makeFilter = (overrides: Partial<FilterBuilderFilter> = {}): FilterBuilderFilter => ({
  id: 1,
  dimensionOrMeasure: null,
  search: '',
  value: null,
  operator: 'equals',
  ...overrides,
});

describe('FilterBuilderItemNumberValueField', () => {
  it('renders a single number input when operator is not "between"', () => {
    const { getAllByRole } = render(
      <FilterBuilderItemNumberValueField
        styles={styles}
        filter={makeFilter()}
        onSelectValue={vi.fn()}
      />,
    );
    expect(getAllByRole('spinbutton')).toHaveLength(1);
  });

  it('renders two inputs and a disabled "and" button when operator is "between"', () => {
    const { getAllByRole, getByRole } = render(
      <FilterBuilderItemNumberValueField
        styles={styles}
        filter={makeFilter({ operator: 'between' })}
        onSelectValue={vi.fn()}
      />,
    );
    expect(getAllByRole('spinbutton')).toHaveLength(2);
    expect(getByRole('button')).toBeDisabled();
  });

  it('initializes the single input with filter.value', () => {
    const { getByRole } = render(
      <FilterBuilderItemNumberValueField
        styles={styles}
        filter={makeFilter({ value: 42 })}
        onSelectValue={vi.fn()}
      />,
    );
    expect(getByRole('spinbutton')).toHaveValue(42);
  });

  it('calls onSelectValue with a number when the single input changes', () => {
    const onSelectValue = vi.fn();
    const { getByRole } = render(
      <FilterBuilderItemNumberValueField
        styles={styles}
        filter={makeFilter()}
        onSelectValue={onSelectValue}
      />,
    );
    fireEvent.change(getByRole('spinbutton'), { target: { value: '7' } });
    expect(onSelectValue).toHaveBeenCalledWith(7);
  });

  it('does not call onSelectValue when the single input is cleared', () => {
    const onSelectValue = vi.fn();
    const { getByRole } = render(
      <FilterBuilderItemNumberValueField
        styles={styles}
        filter={makeFilter()}
        onSelectValue={onSelectValue}
      />,
    );
    fireEvent.change(getByRole('spinbutton'), { target: { value: '' } });
    expect(onSelectValue).not.toHaveBeenCalled();
  });

  it('clears the single input to empty when cleared', () => {
    const { getByRole } = render(
      <FilterBuilderItemNumberValueField
        styles={styles}
        filter={makeFilter({ value: 5 })}
        onSelectValue={vi.fn()}
      />,
    );
    fireEvent.change(getByRole('spinbutton'), { target: { value: '' } });
    expect(getByRole('spinbutton')).toHaveValue(null);
  });

  it('calls onSelectValue with [min, max] when both between inputs have values', () => {
    const onSelectValue = vi.fn();
    const { getAllByRole } = render(
      <FilterBuilderItemNumberValueField
        styles={styles}
        filter={makeFilter({ operator: 'between' })}
        onSelectValue={onSelectValue}
      />,
    );
    const [minInput, maxInput] = getAllByRole('spinbutton');
    fireEvent.change(minInput!, { target: { value: '10' } });
    fireEvent.change(maxInput!, { target: { value: '50' } });
    expect(onSelectValue).toHaveBeenCalledWith([10, 50]);
  });

  it('does not call onSelectValue until both between inputs have values', () => {
    const onSelectValue = vi.fn();
    const { getAllByRole } = render(
      <FilterBuilderItemNumberValueField
        styles={styles}
        filter={makeFilter({ operator: 'between' })}
        onSelectValue={onSelectValue}
      />,
    );
    const [minInput] = getAllByRole('spinbutton');
    fireEvent.change(minInput!, { target: { value: '10' } });
    expect(onSelectValue).not.toHaveBeenCalled();
  });

  it('calls onSelectValue with the initial filter.value on mount when non-null', () => {
    const onSelectValue = vi.fn();
    render(
      <FilterBuilderItemNumberValueField
        styles={styles}
        filter={makeFilter({ value: 99 })}
        onSelectValue={onSelectValue}
      />,
    );
    expect(onSelectValue).toHaveBeenCalledWith(99);
  });

  // Root cause of the "stale filter value" bug: the input seeds its local state
  // from filter.value on mount only, so an externally-adopted change on the SAME
  // instance is not reflected. This is why updating embeddableState (what
  // useAdoptDefaultFilters does) was not sufficient on its own.
  it('does not reflect an external filter.value change on the same instance', () => {
    const { rerender, getByRole } = render(
      <FilterBuilderItemNumberValueField
        styles={styles}
        filter={makeFilter({ value: 67 })}
        onSelectValue={vi.fn()}
      />,
    );
    expect(getByRole('spinbutton')).toHaveValue(67);

    rerender(
      <FilterBuilderItemNumberValueField
        styles={styles}
        filter={makeFilter({ value: 100 })}
        onSelectValue={vi.fn()}
      />,
    );
    expect(getByRole('spinbutton')).toHaveValue(67);
  });

  // The fix mechanism: FilterBuilderPro mixes an adopt revision into the filter
  // row key when syncDefaultFilters is on, so an adopted change remounts the field
  // and it re-seeds from the new filter.value.
  it('reflects the new value when its key changes (remount)', () => {
    const { rerender, getByRole } = render(
      <div>
        <FilterBuilderItemNumberValueField
          key="rev-0"
          styles={styles}
          filter={makeFilter({ value: 67 })}
          onSelectValue={vi.fn()}
        />
      </div>,
    );
    expect(getByRole('spinbutton')).toHaveValue(67);

    rerender(
      <div>
        <FilterBuilderItemNumberValueField
          key="rev-1"
          styles={styles}
          filter={makeFilter({ value: 100 })}
          onSelectValue={vi.fn()}
        />
      </div>,
    );
    expect(getByRole('spinbutton')).toHaveValue(100);
  });
});
