import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import FilterBuilderTextValueField from './FilterBuilderTextValueField';
import type { FilterBuilderFilter } from '../definition';

vi.mock('../FilterBuilderPro.module.css', () => ({
  default: { valueInput: 'valueInput' },
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  useDebounce: (fn: (...args: unknown[]) => void) => fn,
}));

const makeFilter = (overrides: Partial<FilterBuilderFilter> = {}): FilterBuilderFilter => ({
  id: 1,
  dimensionOrMeasure: null,
  search: '',
  value: '',
  operator: 'is',
  ...overrides,
});

describe('FilterBuilderTextValueField', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a text input', () => {
    render(<FilterBuilderTextValueField filter={makeFilter()} onSelectValue={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('initialises the input with the filter value', () => {
    render(
      <FilterBuilderTextValueField
        filter={makeFilter({ value: 'hello' })}
        onSelectValue={vi.fn()}
      />,
    );
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });

  it('renders an empty input when filter.value is null', () => {
    render(
      <FilterBuilderTextValueField filter={makeFilter({ value: null })} onSelectValue={vi.fn()} />,
    );
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('calls onSelectValue with the typed value when the user types', () => {
    const onSelectValue = vi.fn();
    render(
      <FilterBuilderTextValueField
        filter={makeFilter({ value: '' })}
        onSelectValue={onSelectValue}
      />,
    );
    onSelectValue.mockClear();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'world' } });
    expect(onSelectValue).toHaveBeenLastCalledWith('world');
  });

  it('calls onSelectValue with null when the input is cleared', () => {
    const onSelectValue = vi.fn();
    render(
      <FilterBuilderTextValueField
        filter={makeFilter({ value: 'something' })}
        onSelectValue={onSelectValue}
      />,
    );
    onSelectValue.mockClear();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    expect(onSelectValue).toHaveBeenLastCalledWith(null);
  });

  it('calls onSelectValue on initial mount with the initial value', () => {
    const onSelectValue = vi.fn();
    render(
      <FilterBuilderTextValueField
        filter={makeFilter({ value: 'initial' })}
        onSelectValue={onSelectValue}
      />,
    );
    expect(onSelectValue).toHaveBeenCalledWith('initial');
  });

  it('focuses the input after 100ms on mount', () => {
    render(<FilterBuilderTextValueField filter={makeFilter()} onSelectValue={vi.fn()} />);
    const input = screen.getByRole('textbox');
    const focusSpy = vi.spyOn(input, 'focus');

    vi.advanceTimersByTime(100);
    expect(focusSpy).toHaveBeenCalled();
  });

  it('focuses the input after 100ms when the operator changes', () => {
    const { rerender } = render(
      <FilterBuilderTextValueField
        filter={makeFilter({ operator: 'is' })}
        onSelectValue={vi.fn()}
      />,
    );
    vi.advanceTimersByTime(100);

    const input = screen.getByRole('textbox');
    const focusSpy = vi.spyOn(input, 'focus');

    rerender(
      <FilterBuilderTextValueField
        filter={makeFilter({ operator: 'isNot' })}
        onSelectValue={vi.fn()}
      />,
    );
    vi.advanceTimersByTime(100);
    expect(focusSpy).toHaveBeenCalled();
  });

  it('does not focus the input before the 100ms delay elapses', () => {
    const { rerender } = render(
      <FilterBuilderTextValueField
        filter={makeFilter({ operator: 'is' })}
        onSelectValue={vi.fn()}
      />,
    );
    vi.advanceTimersByTime(100);

    const input = screen.getByRole('textbox');
    const focusSpy = vi.spyOn(input, 'focus');

    rerender(
      <FilterBuilderTextValueField
        filter={makeFilter({ operator: 'isNot' })}
        onSelectValue={vi.fn()}
      />,
    );
    vi.advanceTimersByTime(50);
    expect(focusSpy).not.toHaveBeenCalled();
  });
});
