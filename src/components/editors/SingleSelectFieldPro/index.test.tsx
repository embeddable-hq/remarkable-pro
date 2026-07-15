import { render, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import SingleSelectFieldPro from './index';
import type { Dimension, DataResponse } from '@embeddable.com/core';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('../../../theme/formatter/formatter.utils', () => ({
  getThemeFormatter: vi.fn(() => ({
    data: vi.fn((_dim: unknown, value: unknown) => `label-${String(value)}`),
  })),
}));

vi.mock('../../../theme/i18n/i18n', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

vi.mock('../shared/EditorCard/EditorCard', () => ({
  EditorCard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../component.utils', () => ({
  resolveI18nProps: vi.fn((props: object) => props),
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  SingleSelectField: ({
    value,
    onChange,
    onSearch,
    clearable,
    placeholder,
    isLoading,
    noOptionsMessage,
    options,
  }: {
    value?: string;
    onChange: (v: string | null) => void;
    onSearch?: (v: string) => void;
    clearable?: boolean;
    placeholder?: string;
    isLoading?: boolean;
    noOptionsMessage?: string;
    options: { value: string; label: string }[];
  }) => (
    <div
      data-testid="single-select"
      data-value={value ?? ''}
      data-clearable={String(clearable ?? false)}
      data-placeholder={placeholder ?? ''}
      data-loading={String(isLoading ?? false)}
      data-no-options-message={noOptionsMessage ?? ''}
    >
      {options.map((o) => (
        <button key={o.value} data-testid={`option-${o.value}`} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
      <input data-testid="search-input" onChange={(e) => onSearch?.(e.target.value)} />
    </div>
  ),
}));

const country = { name: 'country', title: 'Country' } as Dimension;
const region = { name: 'region', title: 'Region' } as Dimension;

const makeResults = (values: string[] = [], isLoading = false): DataResponse =>
  ({
    data: values.map((v) => ({ country: v, region: `${v}-region` })),
    isLoading,
  }) as unknown as DataResponse;

describe('SingleSelectFieldPro', () => {
  it('renders the SingleSelectField', () => {
    const { getByTestId } = render(
      <SingleSelectFieldPro dimension={country} results={makeResults(['US', 'UK'])} clearable />,
    );
    expect(getByTestId('single-select')).toBeInTheDocument();
  });

  it('maps results.data into options using the dimension field', () => {
    const { getByTestId } = render(
      <SingleSelectFieldPro dimension={country} results={makeResults(['US', 'UK'])} clearable />,
    );
    expect(getByTestId('option-US')).toBeInTheDocument();
    expect(getByTestId('option-UK')).toBeInTheDocument();
  });

  it('uses optionalSecondDimension as the option value while keeping the dimension label', () => {
    const { getByTestId } = render(
      <SingleSelectFieldPro
        dimension={country}
        optionalSecondDimension={region}
        results={makeResults(['US'])}
        clearable
      />,
    );
    expect(getByTestId('option-US-region')).toBeInTheDocument();
    expect(getByTestId('option-US-region')).toHaveTextContent('label-US');
  });

  it('passes selectedValue as value to SingleSelectField', () => {
    const { getByTestId } = render(
      <SingleSelectFieldPro
        dimension={country}
        results={makeResults(['US', 'UK'])}
        selectedValue="UK"
        clearable
      />,
    );
    expect(getByTestId('single-select')).toHaveAttribute('data-value', 'UK');
  });

  it('passes clearable prop to SingleSelectField', () => {
    const { getByTestId } = render(
      <SingleSelectFieldPro dimension={country} results={makeResults(['US'])} clearable />,
    );
    expect(getByTestId('single-select')).toHaveAttribute('data-clearable', 'true');
  });

  it('passes placeholder prop to SingleSelectField', () => {
    const { getByTestId } = render(
      <SingleSelectFieldPro
        dimension={country}
        results={makeResults(['US'])}
        placeholder="Select a country"
        clearable
      />,
    );
    expect(getByTestId('single-select')).toHaveAttribute('data-placeholder', 'Select a country');
  });

  it('passes isLoading through to SingleSelectField', () => {
    const { getByTestId } = render(
      <SingleSelectFieldPro dimension={country} results={makeResults(['US'], true)} clearable />,
    );
    expect(getByTestId('single-select')).toHaveAttribute('data-loading', 'true');
  });

  it('shows noOptionsMessage when results are empty and not loading', () => {
    const { getByTestId } = render(
      <SingleSelectFieldPro dimension={country} results={makeResults([], false)} clearable />,
    );
    expect(getByTestId('single-select')).toHaveAttribute(
      'data-no-options-message',
      'common.noOptionsFound',
    );
  });

  it('does not show noOptionsMessage while loading, even with no data', () => {
    const { getByTestId } = render(
      <SingleSelectFieldPro dimension={country} results={makeResults([], true)} clearable />,
    );
    expect(getByTestId('single-select')).toHaveAttribute('data-no-options-message', '');
  });

  it('does not show noOptionsMessage when there are options', () => {
    const { getByTestId } = render(
      <SingleSelectFieldPro dimension={country} results={makeResults(['US'])} clearable />,
    );
    expect(getByTestId('single-select')).toHaveAttribute('data-no-options-message', '');
  });

  it('calls onChange with the selected option value', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <SingleSelectFieldPro
        dimension={country}
        results={makeResults(['US', 'UK'])}
        clearable
        onChange={onChange}
      />,
    );
    fireEvent.click(getByTestId('option-UK'));
    expect(onChange).toHaveBeenCalledWith('UK');
  });

  it('calls setSearchValue when the search input changes', () => {
    const setSearchValue = vi.fn();
    const { getByTestId } = render(
      <SingleSelectFieldPro
        dimension={country}
        results={makeResults(['US'])}
        clearable
        setSearchValue={setSearchValue}
      />,
    );
    fireEvent.change(getByTestId('search-input'), { target: { value: 'un' } });
    expect(setSearchValue).toHaveBeenCalledWith('un');
  });

  it('auto-selects the first option when not clearable and there is no selection', () => {
    const onChange = vi.fn();
    render(
      <SingleSelectFieldPro
        dimension={country}
        results={makeResults(['US', 'UK'])}
        onChange={onChange}
      />,
    );
    expect(onChange).toHaveBeenCalledWith('US');
  });

  it('does not auto-select when clearable is true', () => {
    const onChange = vi.fn();
    render(
      <SingleSelectFieldPro
        dimension={country}
        results={makeResults(['US', 'UK'])}
        clearable
        onChange={onChange}
      />,
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not auto-select when a selectedValue is already set', () => {
    const onChange = vi.fn();
    render(
      <SingleSelectFieldPro
        dimension={country}
        results={makeResults(['US', 'UK'])}
        selectedValue="UK"
        onChange={onChange}
      />,
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not auto-select when there are no options', () => {
    const onChange = vi.fn();
    render(
      <SingleSelectFieldPro dimension={country} results={makeResults([])} onChange={onChange} />,
    );
    expect(onChange).not.toHaveBeenCalled();
  });
});
