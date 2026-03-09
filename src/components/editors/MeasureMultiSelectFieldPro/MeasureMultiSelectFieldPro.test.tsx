import { render, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import MeasureMultiSelectFieldPro from './index';
import { getDimensionAndMeasureOptions } from '../utils/dimensionsAndMeasures.utils';
import type { Measure } from '@embeddable.com/core';

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
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

vi.mock('../utils/dimensionsAndMeasures.utils', () => ({
  getDimensionAndMeasureOptions: vi.fn(() => [
    { value: 'revenue', label: 'Revenue' },
    { value: 'count', label: 'Count' },
  ]),
}));

const revenue = { name: 'revenue', title: 'Revenue' } as Measure;
const count = { name: 'count', title: 'Count' } as Measure;

describe('MeasureMultiSelectFieldPro', () => {
  it('renders the MultiSelectField', () => {
    const { getByTestId } = render(
      <MeasureMultiSelectFieldPro measureOptions={[revenue, count]} onChange={vi.fn()} />,
    );
    expect(getByTestId('multi-select')).toBeInTheDocument();
  });

  it('passes selected names as values to MultiSelectField', () => {
    const { getByTestId } = render(
      <MeasureMultiSelectFieldPro
        measureOptions={[revenue, count]}
        selectedMeasures={[revenue, count]}
        onChange={vi.fn()}
      />,
    );
    expect(getByTestId('multi-select')).toHaveAttribute('data-values', 'revenue,count');
  });

  it('passes empty values when nothing is selected', () => {
    const { getByTestId } = render(
      <MeasureMultiSelectFieldPro measureOptions={[revenue, count]} onChange={vi.fn()} />,
    );
    expect(getByTestId('multi-select')).toHaveAttribute('data-values', '');
  });

  it('passes clearable prop to MultiSelectField', () => {
    const { getByTestId } = render(
      <MeasureMultiSelectFieldPro measureOptions={[revenue, count]} clearable onChange={vi.fn()} />,
    );
    expect(getByTestId('multi-select')).toHaveAttribute('data-clearable', 'true');
  });

  it('passes placeholder prop to MultiSelectField', () => {
    const { getByTestId } = render(
      <MeasureMultiSelectFieldPro
        measureOptions={[revenue, count]}
        placeholder="Select measures"
        onChange={vi.fn()}
      />,
    );
    expect(getByTestId('multi-select')).toHaveAttribute('data-placeholder', 'Select measures');
  });

  it('shows noOptionsMessage when measureOptions is empty', () => {
    render(<MeasureMultiSelectFieldPro measureOptions={[]} onChange={vi.fn()} />);
    expect(getDimensionAndMeasureOptions).toHaveBeenCalledWith(
      expect.objectContaining({ dimensionsAndMeasures: [] }),
    );
  });

  it('calls onChange with matching option when an option is selected', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <MeasureMultiSelectFieldPro measureOptions={[revenue, count]} onChange={onChange} />,
    );
    fireEvent.click(getByTestId('option-revenue'));
    expect(onChange).toHaveBeenCalledWith([revenue]);
  });

  it('calls onChange with multiple options when multiple options are selected (controlled)', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <MeasureMultiSelectFieldPro
        measureOptions={[revenue, count]}
        selectedMeasures={[revenue]}
        onChange={onChange}
      />,
    );
    fireEvent.click(getByTestId('option-count'));
    expect(onChange).toHaveBeenCalledWith([revenue, count]);
  });

  it('calls onChange with filtered selection when deselecting', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <MeasureMultiSelectFieldPro
        measureOptions={[revenue, count]}
        selectedMeasures={[revenue, count]}
        onChange={onChange}
      />,
    );
    fireEvent.click(getByTestId('option-count'));
    expect(onChange).toHaveBeenCalledWith([revenue]);
  });

  it('passes updated searchValue to getDimensionAndMeasureOptions when search changes', () => {
    const { getByTestId } = render(
      <MeasureMultiSelectFieldPro measureOptions={[revenue, count]} onChange={vi.fn()} />,
    );
    fireEvent.change(getByTestId('search-input'), { target: { value: 'rev' } });
    expect(getDimensionAndMeasureOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ searchValue: 'rev' }),
    );
  });

  it('calls getDimensionAndMeasureOptions with measureOptions as dimensionsAndMeasures and theme', () => {
    render(<MeasureMultiSelectFieldPro measureOptions={[revenue, count]} onChange={vi.fn()} />);
    expect(getDimensionAndMeasureOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        dimensionsAndMeasures: [revenue, count],
        searchValue: '',
      }),
    );
  });
});
