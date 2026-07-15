import { render, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import MultiSelectFieldPro from './index';
import type { Dimension, DataResponse } from '@embeddable.com/core';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('../../../theme/formatter/formatter.utils', () => ({
  getThemeFormatter: vi.fn(() => ({
    data: vi.fn((_dim: unknown, value: unknown) => String(value)),
  })),
}));

vi.mock('../../../theme/i18n/i18n', () => ({
  i18nSetup: vi.fn(),
  i18n: { t: vi.fn((key: string) => key) },
}));

vi.mock('../shared/EditorCard/EditorCard', () => ({
  EditorCard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../component.utils', () => ({
  resolveI18nProps: vi.fn((props: object) => props),
}));

vi.mock('@embeddable.com/remarkable-ui', async () => {
  const { MultiSelectFieldMock } = await import('../test-utils/multiSelectField.mock');
  return { MultiSelectField: MultiSelectFieldMock };
});

const country = { name: 'country', title: 'Country' } as Dimension;
const region = { name: 'region', title: 'Region' } as Dimension;

const resultsWith = (data: Record<string, unknown>[], isLoading = false): DataResponse => ({
  isLoading,
  data,
});

describe('MultiSelectFieldPro', () => {
  it('renders the MultiSelectField', () => {
    const { getByTestId } = render(
      <MultiSelectFieldPro
        dimension={country}
        results={resultsWith([{ country: 'US' }, { country: 'UK' }])}
        onChange={vi.fn()}
      />,
    );
    expect(getByTestId('multi-select')).toBeInTheDocument();
  });

  it('maps results.data into options using the dimension value/label', () => {
    const { getByTestId } = render(
      <MultiSelectFieldPro
        dimension={country}
        results={resultsWith([{ country: 'US' }, { country: 'UK' }])}
        selectedValues={['US']}
        onChange={vi.fn()}
      />,
    );
    expect(getByTestId('option-US')).toBeInTheDocument();
    expect(getByTestId('option-UK')).toBeInTheDocument();
  });

  it('uses optionalSecondDimension for option value while keeping the first dimension label', () => {
    const { getByTestId } = render(
      <MultiSelectFieldPro
        dimension={country}
        optionalSecondDimension={region}
        results={resultsWith([{ country: 'US', region: 'na' }])}
        selectedValues={['na']}
        onChange={vi.fn()}
      />,
    );
    expect(getByTestId('option-na')).toBeInTheDocument();
  });

  it('passes selectedValues as values to MultiSelectField', () => {
    const { getByTestId } = render(
      <MultiSelectFieldPro
        dimension={country}
        results={resultsWith([{ country: 'US' }, { country: 'UK' }])}
        selectedValues={['US', 'UK']}
        onChange={vi.fn()}
      />,
    );
    expect(getByTestId('multi-select')).toHaveAttribute('data-values', 'US,UK');
  });

  it('passes empty values when selectedValues is undefined', () => {
    const { getByTestId } = render(
      <MultiSelectFieldPro
        dimension={country}
        results={resultsWith([{ country: 'US' }])}
        onChange={vi.fn()}
      />,
    );
    expect(getByTestId('multi-select')).toHaveAttribute('data-values', '');
  });

  it('passes clearable prop through as isClearable', () => {
    const { getByTestId } = render(
      <MultiSelectFieldPro
        dimension={country}
        results={resultsWith([{ country: 'US' }])}
        clearable
        onChange={vi.fn()}
      />,
    );
    expect(getByTestId('multi-select')).toHaveAttribute('data-clearable', 'true');
  });

  it('passes placeholder prop to MultiSelectField', () => {
    const { getByTestId } = render(
      <MultiSelectFieldPro
        dimension={country}
        results={resultsWith([{ country: 'US' }])}
        placeholder="Select country"
        onChange={vi.fn()}
      />,
    );
    expect(getByTestId('multi-select')).toHaveAttribute('data-placeholder', 'Select country');
  });

  it('shows noOptionsMessage when results.data is empty and not loading', () => {
    const { getByTestId } = render(
      <MultiSelectFieldPro dimension={country} results={resultsWith([])} onChange={vi.fn()} />,
    );
    expect(getByTestId('multi-select')).toHaveAttribute(
      'data-no-options-message',
      'common.noOptionsFound',
    );
  });

  it('does not show noOptionsMessage while loading, even with no data', () => {
    const { getByTestId } = render(
      <MultiSelectFieldPro
        dimension={country}
        results={resultsWith([], true)}
        onChange={vi.fn()}
      />,
    );
    expect(getByTestId('multi-select')).toHaveAttribute('data-no-options-message', '');
  });

  it('does not show noOptionsMessage when data is present', () => {
    const { getByTestId } = render(
      <MultiSelectFieldPro
        dimension={country}
        results={resultsWith([{ country: 'US' }])}
        onChange={vi.fn()}
      />,
    );
    expect(getByTestId('multi-select')).toHaveAttribute('data-no-options-message', '');
  });

  it('calls onChange with the selected value added when an option is clicked', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <MultiSelectFieldPro
        dimension={country}
        results={resultsWith([{ country: 'US' }, { country: 'UK' }])}
        selectedValues={['US']}
        onChange={onChange}
      />,
    );
    fireEvent.click(getByTestId('option-UK'));
    expect(onChange).toHaveBeenCalledWith(['US', 'UK']);
  });

  it('calls onChange with the value removed when an already-selected option is clicked', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <MultiSelectFieldPro
        dimension={country}
        results={resultsWith([{ country: 'US' }, { country: 'UK' }])}
        selectedValues={['US', 'UK']}
        onChange={onChange}
      />,
    );
    fireEvent.click(getByTestId('option-UK'));
    expect(onChange).toHaveBeenCalledWith(['US']);
  });

  it('wires setSearchValue to the MultiSelectField search input', () => {
    const setSearchValue = vi.fn();
    const { getByTestId } = render(
      <MultiSelectFieldPro
        dimension={country}
        results={resultsWith([{ country: 'US' }])}
        setSearchValue={setSearchValue}
        onChange={vi.fn()}
      />,
    );
    fireEvent.change(getByTestId('search-input'), { target: { value: 'U' } });
    expect(setSearchValue).toHaveBeenCalledWith('U');
  });

  describe('auto-selecting the first option when not clearable', () => {
    it('auto-selects the first option when not clearable and nothing is selected', () => {
      const onChange = vi.fn();
      render(
        <MultiSelectFieldPro
          dimension={country}
          results={resultsWith([{ country: 'US' }, { country: 'UK' }])}
          onChange={onChange}
        />,
      );
      expect(onChange).toHaveBeenCalledWith(['US']);
    });

    it('does not auto-select when clearable is true', () => {
      const onChange = vi.fn();
      render(
        <MultiSelectFieldPro
          dimension={country}
          results={resultsWith([{ country: 'US' }, { country: 'UK' }])}
          clearable
          onChange={onChange}
        />,
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not auto-select when a value is already selected', () => {
      const onChange = vi.fn();
      render(
        <MultiSelectFieldPro
          dimension={country}
          results={resultsWith([{ country: 'US' }, { country: 'UK' }])}
          selectedValues={['UK']}
          onChange={onChange}
        />,
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not auto-select when there are no options', () => {
      const onChange = vi.fn();
      render(
        <MultiSelectFieldPro dimension={country} results={resultsWith([])} onChange={onChange} />,
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not auto-select when selectedValues is an empty array', () => {
      const onChange = vi.fn();
      render(
        <MultiSelectFieldPro
          dimension={country}
          results={resultsWith([{ country: 'US' }])}
          selectedValues={[]}
          onChange={onChange}
        />,
      );
      expect(onChange).toHaveBeenCalledWith(['US']);
    });
  });
});
