import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import FilterBuilderPro from './index';
import type { DimensionOrMeasure } from '@embeddable.com/core';
import type { FilterBuilderState } from './definition';
import {
  filterBuilderAndOrOperator,
  FilterBuilderClause,
  FilterBuilderFilter,
} from '../filters.utils';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('./FilterBuilderPro.module.css', () => ({
  default: {
    container: 'container',
    scroll: 'scroll',
    scrollLeftButton: 'scrollLeftButton',
    scrollRightButton: 'scrollRightButton',
    clearButton: 'clearButton',
  },
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18nSetup: vi.fn(),
  i18n: { t: vi.fn((key: string) => key) },
}));

vi.mock('@embeddable.com/react', () => ({
  useTheme: vi.fn().mockReturnValue({}),
}));

vi.mock('@tabler/icons-react', () => ({
  IconPlus: () => <span data-testid="icon-plus" />,
  IconChevronRight: () => <span data-testid="icon-chevron-right" />,
  IconChevronLeft: () => <span data-testid="icon-chevron-left" />,
}));

vi.mock('@embeddable.com/remarkable-ui', async () => {
  const { TooltipMock } = await import('../test-utils');
  return {
    SingleSelectField: ({
      triggerComponent,
      onChange,
      options,
    }: {
      triggerComponent: React.ReactNode;
      onChange: (v: string | null) => void;
      options: { value: string; label: string }[];
    }) => (
      <div data-testid="new-filter-select">
        {triggerComponent}
        {options.map((o) => (
          <button
            key={o.value}
            data-testid={`add-option-${o.value}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    ),
    ActionIcon: ({ icon: Icon }: { icon: React.ComponentType }) => (
      <button data-testid="action-icon">
        <Icon />
      </button>
    ),
    Tooltip: TooltipMock,
  };
});

vi.mock('./components/FilterBuilderItem', () => ({
  default: ({
    filter,
    onSelectDimensionOrMeasure,
    onSelectOperator,
    onSelectValue,
    onSearchValue,
    onDelete,
  }: {
    filter: FilterBuilderFilter;
    onSelectDimensionOrMeasure: (v: string | null) => void;
    onSelectOperator: (v: string | null) => void;
    onSelectValue: (v: FilterBuilderFilter['value']) => void;
    onSearchValue: (v: string) => void;
    onDelete: () => void;
  }) => (
    <div data-testid={`filter-item-${filter.id}`}>
      <button
        data-testid={`select-dim-${filter.id}`}
        onClick={() => onSelectDimensionOrMeasure('country')}
      >
        Select Dim
      </button>
      <button data-testid={`select-op-${filter.id}`} onClick={() => onSelectOperator('is')}>
        Select Op
      </button>
      <button data-testid={`select-val-${filter.id}`} onClick={() => onSelectValue('France')}>
        Select Val
      </button>
      <button data-testid={`search-${filter.id}`} onClick={() => onSearchValue('fr')}>
        Search
      </button>
      <button data-testid={`delete-${filter.id}`} onClick={onDelete}>
        Delete
      </button>
    </div>
  ),
}));

vi.mock('../../shared/EditorCard/EditorCard', () => ({
  EditorCard: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="editor-card" data-title={title}>
      {children}
    </div>
  ),
}));

vi.mock('../../utils/dimensionsAndMeasures.utils', () => ({
  getDimensionAndMeasureOptions: vi.fn(() => [{ value: 'country', label: 'Country' }]),
}));

vi.mock('../../../component.utils', () => ({
  resolveI18nProps: vi.fn((props) => props),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeDim = (
  name = 'country',
  nativeType = 'string',
  type: 'dimension' | 'measure' = 'dimension',
): DimensionOrMeasure =>
  ({
    name,
    title: name.charAt(0).toUpperCase() + name.slice(1),
    nativeType,
    __type__: type,
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
  dimensionsAndMeasures: [makeDim('country'), makeDim('revenue', 'number')],
  setEmbeddableState: vi.fn(),
  onChange: vi.fn(),
};

// Capture the functional updater passed to setEmbeddableState and apply it to a given state.
const applyUpdater = (
  mock: ReturnType<typeof vi.fn>,
  prevState: FilterBuilderState,
): FilterBuilderState => {
  const updater = mock.mock.calls.at(-1)?.[0];
  return typeof updater === 'function' ? updater(prevState) : updater;
};

const emptyFilterState = (): FilterBuilderState => ({
  filters: [],
  operator: filterBuilderAndOrOperator.AND,
});

// A valid single-clause defaultFilters value used across multiple tests.
const defaultFilterClause: FilterBuilderClause = {
  operator: filterBuilderAndOrOperator.AND,
  clauses: [{ property: 'country', operator: 'equals' as never, value: 'France' }],
};

const simulateScrollState = (
  scrollEl: Element,
  scrollLeft: number,
  clientWidth: number,
  scrollWidth: number,
) => {
  Object.defineProperty(scrollEl, 'scrollLeft', { value: scrollLeft, configurable: true });
  Object.defineProperty(scrollEl, 'clientWidth', { value: clientWidth, configurable: true });
  Object.defineProperty(scrollEl, 'scrollWidth', { value: scrollWidth, configurable: true });
  fireEvent.scroll(scrollEl);
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // jsdom doesn't implement ResizeObserver — must be a real constructor
  globalThis.ResizeObserver = vi.fn().mockImplementation(function () {
    return { observe: vi.fn(), disconnect: vi.fn() };
  }) as unknown as typeof ResizeObserver;

  // jsdom doesn't implement scrollBy / scrollTo on elements
  Element.prototype.scrollBy = vi.fn();
  Element.prototype.scrollTo = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FilterBuilderPro', () => {
  describe('rendering', () => {
    it('renders the EditorCard wrapper', () => {
      render(<FilterBuilderPro {...defaultProps} />);
      expect(screen.getByTestId('editor-card')).toBeInTheDocument();
    });

    it('renders one empty FilterBuilderItem when embeddableState has no filters', () => {
      render(<FilterBuilderPro {...defaultProps} />);
      expect(screen.getByTestId('filter-item-1')).toBeInTheDocument();
    });

    it('renders a FilterBuilderItem for each filter in embeddableState', () => {
      const embeddableState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [makeFilter({ id: 1 }), makeFilter({ id: 2 })],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={embeddableState} />);
      expect(screen.getByTestId('filter-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('filter-item-2')).toBeInTheDocument();
    });

    it('does not render the add-filter (+) button when the first filter has no dimensionOrMeasure', () => {
      render(<FilterBuilderPro {...defaultProps} />);
      expect(screen.queryByTestId('new-filter-select')).not.toBeInTheDocument();
    });

    it('renders the add-filter (+) button when the first filter has a dimensionOrMeasure', () => {
      const embeddableState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [makeFilter({ id: 1, dimensionOrMeasure: makeDim('country') })],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={embeddableState} />);
      expect(screen.getByTestId('new-filter-select')).toBeInTheDocument();
    });

    it('does not render the clear-all button when no filter is complete', () => {
      render(<FilterBuilderPro {...defaultProps} />);
      expect(screen.queryByText('editors.filterBuilder.clearAll')).not.toBeInTheDocument();
    });

    it('renders the clear-all button when at least one filter is fully set', () => {
      const embeddableState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [
          makeFilter({
            id: 1,
            dimensionOrMeasure: makeDim('country'),
            operator: 'is',
            value: 'France',
          }),
        ],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={embeddableState} />);
      expect(screen.getByText('editors.filterBuilder.clearAll')).toBeInTheDocument();
    });
  });

  describe('defaultFilters', () => {
    it('seeds filters from defaultFilters when embeddableState has no existing filters', () => {
      render(
        <FilterBuilderPro
          {...defaultProps}
          dimensionsAndMeasures={[makeDim('country')]}
          defaultFilters={defaultFilterClause}
        />,
      );
      expect(defaultProps.setEmbeddableState).toHaveBeenCalled();
      const next = applyUpdater(defaultProps.setEmbeddableState, emptyFilterState());
      expect(next.filters).toHaveLength(1);
      expect(next.filters[0]!.value).toBe('France');
    });

    it('with syncDefaultFilters, adopts a genuinely new defaultFilters even when state already has filters', () => {
      const existing: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [
          makeFilter({
            id: 1,
            dimensionOrMeasure: makeDim('country'),
            operator: 'is',
            value: 'UK',
          }),
        ],
      };
      render(
        <FilterBuilderPro
          {...defaultProps}
          dimensionsAndMeasures={[makeDim('country')]}
          defaultFilters={defaultFilterClause}
          embeddableState={existing}
          syncDefaultFilters
        />,
      );
      expect(defaultProps.setEmbeddableState).toHaveBeenCalled();
      const next = applyUpdater(defaultProps.setEmbeddableState, existing);
      expect(next.filters).toHaveLength(1);
      expect(next.filters[0]!.value).toBe('France');
    });

    it('by default (seed-once), preserves existing filters when state is non-empty', () => {
      const existing: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [
          makeFilter({
            id: 1,
            dimensionOrMeasure: makeDim('country'),
            operator: 'is',
            value: 'UK',
          }),
        ],
      };
      render(
        <FilterBuilderPro
          {...defaultProps}
          dimensionsAndMeasures={[makeDim('country')]}
          defaultFilters={defaultFilterClause}
          embeddableState={existing}
        />,
      );
      // The adopt effect may still fire, but the updater must bail out and keep
      // the existing filters untouched (backward-compatible seed-once).
      const next = applyUpdater(defaultProps.setEmbeddableState, existing);
      expect(next.filters).toEqual(existing.filters);
    });

    it('adopts a new defaultFilters value pushed after mount', () => {
      const { rerender } = render(
        <FilterBuilderPro
          {...defaultProps}
          dimensionsAndMeasures={[makeDim('country')]}
          defaultFilters={defaultFilterClause}
        />,
      );

      const nextClause: FilterBuilderClause = {
        operator: filterBuilderAndOrOperator.AND,
        clauses: [{ property: 'country', operator: 'equals' as never, value: 'Spain' }],
      };
      defaultProps.setEmbeddableState.mockClear();

      rerender(
        <FilterBuilderPro
          {...defaultProps}
          dimensionsAndMeasures={[makeDim('country')]}
          defaultFilters={nextClause}
        />,
      );

      expect(defaultProps.setEmbeddableState).toHaveBeenCalled();
      const next = applyUpdater(defaultProps.setEmbeddableState, emptyFilterState());
      expect(next.filters[0]!.value).toBe('Spain');
    });

    it('ignores its own onChange echo coming back through the bound variable', () => {
      const existing: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [
          makeFilter({
            id: 1,
            dimensionOrMeasure: makeDim('country'),
            operator: 'is',
            value: 'UK',
          }),
        ],
      };
      // First mount without defaultFilters so the component emits its current
      // clause; that emitted value is what the platform feeds back as defaultFilters.
      const { rerender } = render(
        <FilterBuilderPro
          {...defaultProps}
          dimensionsAndMeasures={[makeDim('country')]}
          embeddableState={existing}
        />,
      );
      const echoed = defaultProps.onChange.mock.calls.at(-1)?.[0] as FilterBuilderClause;
      expect(echoed).toBeTruthy();

      defaultProps.setEmbeddableState.mockClear();

      rerender(
        <FilterBuilderPro
          {...defaultProps}
          dimensionsAndMeasures={[makeDim('country')]}
          embeddableState={existing}
          defaultFilters={echoed}
        />,
      );

      // The echo must not trigger a re-adoption that would reset ids/search.
      expect(defaultProps.setEmbeddableState).not.toHaveBeenCalled();
    });

    it('with syncDefaultFilters, resets to an empty filter list when given a well-formed empty clause', () => {
      const existing: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [
          makeFilter({
            id: 1,
            dimensionOrMeasure: makeDim('country'),
            operator: 'is',
            value: 'UK',
          }),
        ],
      };
      const emptyClause: FilterBuilderClause = {
        operator: filterBuilderAndOrOperator.AND,
        clauses: [],
      };
      render(
        <FilterBuilderPro
          {...defaultProps}
          dimensionsAndMeasures={[makeDim('country')]}
          defaultFilters={emptyClause}
          embeddableState={existing}
          syncDefaultFilters
        />,
      );
      expect(defaultProps.setEmbeddableState).toHaveBeenCalled();
      const next = applyUpdater(defaultProps.setEmbeddableState, existing);
      expect(next.filters).toHaveLength(0);
    });

    it('ignores a null defaultFilters and does not wipe existing filters', () => {
      const existing: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [
          makeFilter({
            id: 1,
            dimensionOrMeasure: makeDim('country'),
            operator: 'is',
            value: 'UK',
          }),
        ],
      };
      render(
        <FilterBuilderPro
          {...defaultProps}
          dimensionsAndMeasures={[makeDim('country')]}
          defaultFilters={null as unknown as FilterBuilderClause}
          embeddableState={existing}
        />,
      );
      expect(defaultProps.setEmbeddableState).not.toHaveBeenCalled();
    });
  });

  describe('handleSelectDimensionOrMeasure', () => {
    it('calls setEmbeddableState with an updated filter when a dimension is selected', () => {
      const prevState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [makeFilter({ id: 1 })],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={prevState} />);

      fireEvent.click(screen.getByTestId('select-dim-1'));

      expect(defaultProps.setEmbeddableState).toHaveBeenCalledTimes(1);
      const next = applyUpdater(defaultProps.setEmbeddableState, prevState);
      expect(next.filters[0]!.dimensionOrMeasure?.name).toBe('country');
      expect(next.filters[0]!.operator).toBeNull();
      expect(next.filters[0]!.value).toBeNull();
    });

    it('preserves the existing filter id when updating the dimension', () => {
      const prevState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [makeFilter({ id: 5 })],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={prevState} />);

      fireEvent.click(screen.getByTestId('select-dim-5'));

      const next = applyUpdater(defaultProps.setEmbeddableState, prevState);
      expect(next.filters[0]!.id).toBe(5);
    });
  });

  describe('handleSelectOperator', () => {
    it('calls setEmbeddableState with the new operator and resets value', () => {
      const prevState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [makeFilter({ id: 1, dimensionOrMeasure: makeDim('country'), value: 'old' })],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={prevState} />);

      fireEvent.click(screen.getByTestId('select-op-1'));

      const next = applyUpdater(defaultProps.setEmbeddableState, prevState);
      expect(next.filters[0]!.operator).toBe('is');
      expect(next.filters[0]!.value).toBeNull();
    });
  });

  describe('handleSelectValue', () => {
    it('calls setEmbeddableState with the new value', () => {
      const prevState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [makeFilter({ id: 1, dimensionOrMeasure: makeDim('country'), operator: 'is' })],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={prevState} />);

      fireEvent.click(screen.getByTestId('select-val-1'));

      const next = applyUpdater(defaultProps.setEmbeddableState, prevState);
      expect(next.filters[0]!.value).toBe('France');
    });
  });

  describe('handleDimensionSearch', () => {
    it('calls setEmbeddableState with the updated search string', () => {
      const prevState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [makeFilter({ id: 1 })],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={prevState} />);

      fireEvent.click(screen.getByTestId('search-1'));

      const next = applyUpdater(defaultProps.setEmbeddableState, prevState);
      expect(next.filters[0]!.search).toBe('fr');
    });
  });

  describe('handleDeleteFilter', () => {
    it('removes the filter at the given index', () => {
      const prevState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [makeFilter({ id: 1 }), makeFilter({ id: 2 })],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={prevState} />);

      fireEvent.click(screen.getByTestId('delete-1'));

      const next = applyUpdater(defaultProps.setEmbeddableState, prevState);
      expect(next.filters).toHaveLength(1);
      expect(next.filters[0]!.id).toBe(2);
    });

    it('removes the correct filter when deleting the second of two', () => {
      const prevState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [makeFilter({ id: 1 }), makeFilter({ id: 2 })],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={prevState} />);

      fireEvent.click(screen.getByTestId('delete-2'));

      const next = applyUpdater(defaultProps.setEmbeddableState, prevState);
      expect(next.filters).toHaveLength(1);
      expect(next.filters[0]!.id).toBe(1);
    });
  });

  describe('handleAddFilter', () => {
    it('appends a new filter when an option is selected from the add-filter dropdown', () => {
      const prevState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [makeFilter({ id: 3, dimensionOrMeasure: makeDim('country') })],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={prevState} />);

      fireEvent.click(screen.getByTestId('add-option-country'));

      const next = applyUpdater(defaultProps.setEmbeddableState, prevState);
      expect(next.filters).toHaveLength(2);
      expect(next.filters[1]!.dimensionOrMeasure?.name).toBe('country');
    });

    it('assigns an id one greater than the last filter id', () => {
      const prevState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [makeFilter({ id: 7, dimensionOrMeasure: makeDim('country') })],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={prevState} />);

      fireEvent.click(screen.getByTestId('add-option-country'));

      const next = applyUpdater(defaultProps.setEmbeddableState, prevState);
      expect(next.filters[1]!.id).toBe(8);
    });
  });

  describe('handleClearAll', () => {
    it('resets filters to a single empty filter when clear-all is clicked', () => {
      const prevState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [
          makeFilter({
            id: 1,
            dimensionOrMeasure: makeDim('country'),
            operator: 'is',
            value: 'France',
          }),
          makeFilter({
            id: 2,
            dimensionOrMeasure: makeDim('revenue', 'number'),
            operator: 'gte',
            value: 100,
          }),
        ],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={prevState} />);

      fireEvent.click(screen.getByText('editors.filterBuilder.clearAll'));

      const next = applyUpdater(defaultProps.setEmbeddableState, prevState);
      expect(next.filters).toHaveLength(1);
      expect(next.filters[0]!.dimensionOrMeasure).toBeNull();
      expect(next.filters[0]!.operator).toBeNull();
      expect(next.filters[0]!.value).toBeNull();
    });
  });

  describe('onChange', () => {
    it('calls onChange with null when filters are empty', () => {
      render(<FilterBuilderPro {...defaultProps} />);
      expect(defaultProps.onChange).toHaveBeenCalledWith(null);
    });

    it('calls onChange with a filter clause when a complete filter is present', () => {
      const embeddableState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [
          makeFilter({
            id: 1,
            dimensionOrMeasure: makeDim('country'),
            operator: 'is',
            value: 'France',
          }),
        ],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={embeddableState} />);
      expect(defaultProps.onChange).toHaveBeenCalledWith(
        expect.objectContaining({ operator: 'and', clauses: expect.any(Array) }),
      );
    });

    it('does not call onChange again when the filter value has not changed', () => {
      const embeddableState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [
          makeFilter({
            id: 1,
            dimensionOrMeasure: makeDim('country'),
            operator: 'is',
            value: 'France',
          }),
        ],
      };
      const { rerender } = render(
        <FilterBuilderPro {...defaultProps} embeddableState={embeddableState} />,
      );
      const callCount = defaultProps.onChange.mock.calls.length;

      rerender(<FilterBuilderPro {...defaultProps} embeddableState={embeddableState} />);

      expect(defaultProps.onChange).toHaveBeenCalledTimes(callCount);
    });
  });

  describe('AND/OR operator with mixed dimension and measure types', () => {
    const measureFilter = (overrides: Partial<FilterBuilderFilter> = {}): FilterBuilderFilter =>
      makeFilter({
        id: 1,
        dimensionOrMeasure: makeDim('total_listens', 'number', 'measure'),
        operator: 'gt',
        value: 10,
        ...overrides,
      });
    const dimensionFilter = (overrides: Partial<FilterBuilderFilter> = {}): FilterBuilderFilter =>
      makeFilter({
        id: 2,
        dimensionOrMeasure: makeDim('age_group'),
        operator: 'is',
        value: '13-17',
        ...overrides,
      });

    it('disables the AND/OR toggle and shows a tooltip when a dimension and a measure are mixed', () => {
      const embeddableState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [measureFilter(), dimensionFilter()],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={embeddableState} />);

      expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
        'editors.filterBuilder.disableOrOperatorToolTip',
      );
      expect(screen.getByRole('button', { name: 'editors.filterBuilder.and' })).toBeDisabled();
    });

    it('keeps the AND/OR toggle enabled when all filters share the same type', () => {
      const embeddableState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [
          makeFilter({
            id: 1,
            dimensionOrMeasure: makeDim('country'),
            operator: 'is',
            value: 'France',
          }),
          dimensionFilter(),
        ],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={embeddableState} />);

      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'editors.filterBuilder.and' })).not.toBeDisabled();
    });

    it('toggles the operator from AND to OR when the AND/OR button is clicked', () => {
      const embeddableState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.AND,
        filters: [
          makeFilter({
            id: 1,
            dimensionOrMeasure: makeDim('country'),
            operator: 'is',
            value: 'France',
          }),
          makeFilter({
            id: 2,
            dimensionOrMeasure: makeDim('city'),
            operator: 'is',
            value: 'Paris',
          }),
        ],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={embeddableState} />);

      fireEvent.click(screen.getByRole('button', { name: 'editors.filterBuilder.and' }));

      const next = applyUpdater(defaultProps.setEmbeddableState, embeddableState);
      expect(next.operator).toBe(filterBuilderAndOrOperator.OR);
    });

    it('does not call onChange while operator is OR with mixed filter types', () => {
      const embeddableState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.OR,
        filters: [measureFilter(), dimensionFilter()],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={embeddableState} />);

      expect(defaultProps.onChange).not.toHaveBeenCalled();
    });

    it('detects a mix from the selected member even when the measure value is incomplete (regression)', () => {
      // Changing a clause's operator clears its value, making the measure "incomplete".
      // The mix must still be detected from the selected member, otherwise OR slips through.
      const embeddableState: FilterBuilderState = {
        operator: filterBuilderAndOrOperator.OR,
        filters: [measureFilter({ value: null }), dimensionFilter()],
      };
      render(<FilterBuilderPro {...defaultProps} embeddableState={embeddableState} />);

      expect(defaultProps.setEmbeddableState).toHaveBeenCalled();
      const next = applyUpdater(defaultProps.setEmbeddableState, embeddableState);
      expect(next.operator).toBe(filterBuilderAndOrOperator.AND);
    });
  });

  describe('scroll buttons', () => {
    it('does not render scroll buttons when scrollRef is at rest (default jsdom)', () => {
      render(<FilterBuilderPro {...defaultProps} />);
      expect(screen.queryByTestId('icon-chevron-left')).not.toBeInTheDocument();
      expect(screen.queryByTestId('icon-chevron-right')).not.toBeInTheDocument();
    });

    it('renders the scroll-right button and calls scrollBy when content overflows', () => {
      render(<FilterBuilderPro {...defaultProps} />);
      simulateScrollState(document.querySelector('.scroll')!, 0, 100, 300);

      fireEvent.click(screen.getByTestId('icon-chevron-right').closest('button')!);
      expect(Element.prototype.scrollBy).toHaveBeenCalledWith({ left: 200, behavior: 'smooth' });
    });

    it('renders the scroll-left button and calls scrollBy when scrolled right', () => {
      render(<FilterBuilderPro {...defaultProps} />);
      simulateScrollState(document.querySelector('.scroll')!, 10, 100, 100);

      fireEvent.click(screen.getByTestId('icon-chevron-left').closest('button')!);
      expect(Element.prototype.scrollBy).toHaveBeenCalledWith({ left: -200, behavior: 'smooth' });
    });

    it('auto-scrolls to the end when a filter changes after mount, even without defaultFilters (regression)', () => {
      // Previously, the auto-scroll guard only cleared inside the defaultFilters
      // effect, so without defaultFilters it never cleared and scroll-to-end
      // never fired after the initial mount.
      vi.useFakeTimers();
      const dims = [makeDim('country')];

      const { rerender } = render(
        <FilterBuilderPro {...defaultProps} dimensionsAndMeasures={dims} />,
      );

      act(() => vi.advanceTimersByTime(100));

      rerender(
        <FilterBuilderPro
          {...defaultProps}
          dimensionsAndMeasures={dims}
          embeddableState={{
            operator: filterBuilderAndOrOperator.AND,
            filters: [
              makeFilter({
                id: 1,
                dimensionOrMeasure: makeDim('country'),
                operator: 'is',
                value: 'France',
              }),
            ],
          }}
        />,
      );

      act(() => vi.advanceTimersByTime(100));

      expect(Element.prototype.scrollTo).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('auto-scrolls to the end when a filter changes after initialisation', () => {
      vi.useFakeTimers();
      const dims = [makeDim('country')];

      const { rerender } = render(
        <FilterBuilderPro
          {...defaultProps}
          dimensionsAndMeasures={dims}
          defaultFilters={defaultFilterClause}
        />,
      );

      // Clear the disableAutoScroll guard set by defaultFilters effect
      act(() => vi.advanceTimersByTime(100));

      rerender(
        <FilterBuilderPro
          {...defaultProps}
          dimensionsAndMeasures={dims}
          defaultFilters={defaultFilterClause}
          embeddableState={{
            operator: filterBuilderAndOrOperator.AND,
            filters: [
              makeFilter({
                id: 1,
                dimensionOrMeasure: makeDim('country'),
                operator: 'is',
                value: 'France',
              }),
            ],
          }}
        />,
      );

      act(() => vi.advanceTimersByTime(100));

      expect(Element.prototype.scrollTo).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
