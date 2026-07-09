import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import FilterBuilderItem from './FilterBuilderItem';
import { getDimensionAndMeasureOptions } from '../../../utils/dimensionsAndMeasures.utils';
import { getSupportedDimensionsAndMeasures } from '../FilterBuilderPro.utils';
import type { DimensionOrMeasure } from '@embeddable.com/core';
import type { FilterBuilderFilter } from '../definition';
import { Theme } from '../../../../../theme/theme.types';

vi.mock('../FilterBuilderPro.module.css', () => ({
  default: {
    filter: 'filter',
    memberButton: 'memberButton',
    addButton: 'addButton',
    deleteButton: 'deleteButton',
  },
}));

vi.mock('../../../../../theme/i18n/i18n', () => ({
  i18n: { t: vi.fn((key: string) => key) },
}));

vi.mock('@tabler/icons-react', () => ({
  IconPlus: () => <span data-testid="icon-plus" />,
  IconX: () => <span data-testid="icon-x" />,
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
  SingleSelectField: ({
    triggerComponent,
    value,
    onChange,
    onSearch,
    options,
  }: {
    triggerComponent: React.ReactNode;
    value?: string;
    onChange: (v: string | null) => void;
    onSearch?: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div data-testid="single-select" data-value={value ?? ''}>
      {triggerComponent}
      {options.map((o) => (
        <button key={o.value} data-testid={`option-${o.value}`} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
      {onSearch && <input data-testid="search-input" onChange={(e) => onSearch(e.target.value)} />}
    </div>
  ),
}));

vi.mock('../../../utils/dimensionsAndMeasures.utils', () => ({
  getDimensionAndMeasureOptions: vi.fn(() => [
    { value: 'country', label: 'Country' },
    { value: 'revenue', label: 'Revenue' },
  ]),
}));

vi.mock('../FilterBuilderPro.utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../FilterBuilderPro.utils')>();
  return {
    ...actual,
    getSupportedDimensionsAndMeasures: vi.fn((dims) => dims),
  };
});

vi.mock('../../components/FilterBuilderItemOperatorValueFields', () => ({
  default: () => <div data-testid="operator-value-fields" />,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeDim = (name = 'country', nativeType = 'string'): DimensionOrMeasure =>
  ({
    name,
    title: name,
    nativeType,
    __type__: 'dimension',
  }) as unknown as DimensionOrMeasure;

const makeFilter = (overrides: Partial<FilterBuilderFilter> = {}): FilterBuilderFilter => ({
  id: 1,
  dimensionOrMeasure: null,
  search: '',
  value: null,
  operator: null,
  ...overrides,
});

const defaultProps = {
  filter: makeFilter(),
  dimensionsAndMeasures: [makeDim('country'), makeDim('revenue')],
  theme: {} as Theme,
  onSelectDimensionOrMeasure: vi.fn(),
  onSelectOperator: vi.fn(),
  onSelectValue: vi.fn(),
  onSearchValue: vi.fn(),
  onDelete: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FilterBuilderItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the SingleSelectField', () => {
    render(<FilterBuilderItem {...defaultProps} />);
    expect(screen.getByTestId('single-select')).toBeInTheDocument();
  });

  it('shows the "add filter" button when no dimensionOrMeasure is selected', () => {
    render(<FilterBuilderItem {...defaultProps} />);
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument();
    expect(screen.getByText('editors.filterBuilder.addFilter')).toBeInTheDocument();
  });

  it('does not show the delete button when no dimensionOrMeasure is selected', () => {
    render(<FilterBuilderItem {...defaultProps} />);
    expect(screen.queryByTestId('icon-x')).not.toBeInTheDocument();
  });

  it('does not render operator/value fields when no dimensionOrMeasure is selected', () => {
    render(<FilterBuilderItem {...defaultProps} />);
    expect(screen.queryByTestId('operator-value-fields')).not.toBeInTheDocument();
  });

  it('shows the selected label button when a dimensionOrMeasure is selected', () => {
    const filter = makeFilter({ dimensionOrMeasure: makeDim('country') });
    render(<FilterBuilderItem {...defaultProps} filter={filter} />);
    expect(document.querySelector('.memberButton')).toHaveTextContent('Country');
    expect(screen.queryByTestId('icon-plus')).not.toBeInTheDocument();
  });

  it('shows the delete button when a dimensionOrMeasure is selected', () => {
    const filter = makeFilter({ dimensionOrMeasure: makeDim('country') });
    render(<FilterBuilderItem {...defaultProps} filter={filter} />);
    expect(screen.getByTestId('icon-x')).toBeInTheDocument();
  });

  it('renders operator/value fields when a dimensionOrMeasure is selected', () => {
    const filter = makeFilter({ dimensionOrMeasure: makeDim('country') });
    render(<FilterBuilderItem {...defaultProps} filter={filter} />);
    expect(screen.getByTestId('operator-value-fields')).toBeInTheDocument();
  });

  it('calls onSelectDimensionOrMeasure when an option is selected', () => {
    render(<FilterBuilderItem {...defaultProps} />);
    fireEvent.click(screen.getByTestId('option-country'));
    expect(defaultProps.onSelectDimensionOrMeasure).toHaveBeenCalledWith('country');
  });

  it('calls onDelete when the delete button is clicked', () => {
    const filter = makeFilter({ dimensionOrMeasure: makeDim('country') });
    render(<FilterBuilderItem {...defaultProps} filter={filter} />);
    fireEvent.click(screen.getByTestId('icon-x').closest('button')!);
    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
  });

  it('passes dimensionsAndMeasures through getSupportedDimensionsAndMeasures', () => {
    render(<FilterBuilderItem {...defaultProps} />);
    expect(getSupportedDimensionsAndMeasures).toHaveBeenCalledWith(
      defaultProps.dimensionsAndMeasures,
    );
  });

  it('calls getDimensionAndMeasureOptions with searchValue when search changes', () => {
    render(<FilterBuilderItem {...defaultProps} />);
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'rev' } });
    expect(getDimensionAndMeasureOptions).toHaveBeenCalledWith(
      expect.objectContaining({ searchValue: 'rev' }),
    );
  });

  it('passes the correct value to SingleSelectField when dimensionOrMeasure is selected', () => {
    const filter = makeFilter({ dimensionOrMeasure: makeDim('country') });
    render(<FilterBuilderItem {...defaultProps} filter={filter} />);
    expect(screen.getByTestId('single-select')).toHaveAttribute('data-value', 'country');
  });
});
