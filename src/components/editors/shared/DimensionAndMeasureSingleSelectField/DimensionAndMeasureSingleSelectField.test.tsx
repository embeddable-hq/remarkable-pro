import { render, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { DimensionAndMeasureSingleSelectField } from './DimensionAndMeasureSingleSelectField';
import { getDimensionAndMeasureOptions } from '../../utils/dimensionsAndMeasures.utils';
import type { Dimension } from '@embeddable.com/core';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  SingleSelectField: ({
    value,
    onChange,
    onSearch,
    clearable,
    placeholder,
    options,
  }: {
    value?: string;
    onChange: (v: string) => void;
    onSearch: (v: string) => void;
    clearable?: boolean;
    placeholder?: string;
    options: { value: string; label: string }[];
  }) => (
    <div
      data-testid="single-select"
      data-value={value ?? ''}
      data-clearable={String(clearable ?? false)}
      data-placeholder={placeholder ?? ''}
    >
      {options.map((o) => (
        <button key={o.value} data-testid={`option-${o.value}`} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
      <input data-testid="search-input" onChange={(e) => onSearch(e.target.value)} />
    </div>
  ),
}));

vi.mock('../../utils/dimensionsAndMeasures.utils', () => ({
  getDimensionAndMeasureOptions: vi.fn(() => [
    { value: 'revenue', label: 'Revenue' },
    { value: 'country', label: 'Country' },
  ]),
}));

const revenue = { name: 'revenue', title: 'Revenue' } as Dimension;
const country = { name: 'country', title: 'Country' } as Dimension;

describe('DimensionAndMeasureSingleSelectField', () => {
  it('renders the SingleSelectField', () => {
    const { getByTestId } = render(
      <DimensionAndMeasureSingleSelectField options={[revenue, country]} onChange={vi.fn()} />,
    );
    expect(getByTestId('single-select')).toBeInTheDocument();
  });

  it('passes selectedValue.name as value to SingleSelectField', () => {
    const { getByTestId } = render(
      <DimensionAndMeasureSingleSelectField
        options={[revenue, country]}
        selectedValue={revenue}
        onChange={vi.fn()}
      />,
    );
    expect(getByTestId('single-select')).toHaveAttribute('data-value', 'revenue');
  });

  it('passes clearable prop to SingleSelectField', () => {
    const { getByTestId } = render(
      <DimensionAndMeasureSingleSelectField
        options={[revenue, country]}
        clearable
        selectedValue={revenue}
        onChange={vi.fn()}
      />,
    );
    expect(getByTestId('single-select')).toHaveAttribute('data-clearable', 'true');
  });

  it('passes placeholder prop to SingleSelectField', () => {
    const { getByTestId } = render(
      <DimensionAndMeasureSingleSelectField
        options={[revenue, country]}
        placeholder="Select a dimension"
        selectedValue={revenue}
        onChange={vi.fn()}
      />,
    );
    expect(getByTestId('single-select')).toHaveAttribute('data-placeholder', 'Select a dimension');
  });

  it('auto-selects the first option when clearable is false and no selectedValue', () => {
    const onChange = vi.fn();
    render(
      <DimensionAndMeasureSingleSelectField options={[revenue, country]} onChange={onChange} />,
    );
    expect(onChange).toHaveBeenCalledWith(revenue);
  });

  it('does not auto-select when clearable is true', () => {
    const onChange = vi.fn();
    render(
      <DimensionAndMeasureSingleSelectField
        options={[revenue, country]}
        clearable
        onChange={onChange}
      />,
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not auto-select when selectedValue is already set', () => {
    const onChange = vi.fn();
    render(
      <DimensionAndMeasureSingleSelectField
        options={[revenue, country]}
        selectedValue={revenue}
        onChange={onChange}
      />,
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange with the matching option when a selection is made', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <DimensionAndMeasureSingleSelectField
        options={[revenue, country]}
        selectedValue={revenue}
        onChange={onChange}
      />,
    );
    fireEvent.click(getByTestId('option-country'));
    expect(onChange).toHaveBeenCalledWith(country);
  });

  it('calls onChange with undefined when the selected value does not match any option', () => {
    const onChange = vi.fn();
    vi.mocked(getDimensionAndMeasureOptions).mockReturnValueOnce([
      { value: 'unknown', label: 'Unknown' },
    ]);
    const { getByTestId } = render(
      <DimensionAndMeasureSingleSelectField
        options={[revenue, country]}
        selectedValue={revenue}
        onChange={onChange}
      />,
    );
    fireEvent.click(getByTestId('option-unknown'));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('passes updated searchValue to getDimensionAndMeasureOptions when search changes', () => {
    const { getByTestId } = render(
      <DimensionAndMeasureSingleSelectField
        options={[revenue, country]}
        selectedValue={revenue}
        onChange={vi.fn()}
      />,
    );
    fireEvent.change(getByTestId('search-input'), { target: { value: 'rev' } });
    expect(getDimensionAndMeasureOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ searchValue: 'rev' }),
    );
  });
});
