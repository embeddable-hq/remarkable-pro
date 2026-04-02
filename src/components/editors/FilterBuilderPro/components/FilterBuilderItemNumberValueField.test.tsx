import { render, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import FilterBuilderItemNumberValueField from './FilterBuilderItemNumberValueField';
import type { FilterBuilderFilter } from '../definition';

vi.mock('@embeddable.com/remarkable-ui', () => ({
  useDebounce: (fn: (...args: unknown[]) => void) => fn,
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18n: { t: (key: string) => key },
}));

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
      <FilterBuilderItemNumberValueField filter={makeFilter()} onSelectValue={vi.fn()} />,
    );
    expect(getAllByRole('spinbutton')).toHaveLength(1);
  });

  it('renders two inputs and a disabled "and" button when operator is "between"', () => {
    const { getAllByRole, getByRole } = render(
      <FilterBuilderItemNumberValueField
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
        filter={makeFilter({ value: 42 })}
        onSelectValue={vi.fn()}
      />,
    );
    expect(getByRole('spinbutton')).toHaveValue(42);
  });

  it('calls onSelectValue with a number when the single input changes', () => {
    const onSelectValue = vi.fn();
    const { getByRole } = render(
      <FilterBuilderItemNumberValueField filter={makeFilter()} onSelectValue={onSelectValue} />,
    );
    fireEvent.change(getByRole('spinbutton'), { target: { value: '7' } });
    expect(onSelectValue).toHaveBeenCalledWith(7);
  });

  it('does not call onSelectValue when the single input is cleared', () => {
    const onSelectValue = vi.fn();
    const { getByRole } = render(
      <FilterBuilderItemNumberValueField filter={makeFilter()} onSelectValue={onSelectValue} />,
    );
    fireEvent.change(getByRole('spinbutton'), { target: { value: '' } });
    expect(onSelectValue).not.toHaveBeenCalled();
  });

  it('clears the single input to empty when cleared', () => {
    const { getByRole } = render(
      <FilterBuilderItemNumberValueField
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
        filter={makeFilter({ value: 99 })}
        onSelectValue={onSelectValue}
      />,
    );
    expect(onSelectValue).toHaveBeenCalledWith(99);
  });
});
