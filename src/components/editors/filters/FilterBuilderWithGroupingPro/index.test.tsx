import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import FilterBuilderWithGroupingPro from './index';
import type { DimensionOrMeasure } from '@embeddable.com/core';
import { filterBuilderAndOrOperator, FilterBuilderClause } from '../filters.utils';
import type { FilterBuilderFilter } from '../filters.utils';
import type {
  FilterBuilderGroupingState,
  FilterBuilderNode,
} from './FilterBuilderWithGroupingPro.utils';

vi.mock('./FilterBuilderWithGroupingPro.module.css', () => ({
  default: {
    container: 'container',
    scroll: 'scroll',
    scrollLeftButton: 'scrollLeftButton',
    scrollRightButton: 'scrollRightButton',
    clearButton: 'clearButton',
    addButton: 'addButton',
  },
}));

vi.mock('../../../../theme/i18n/i18n', () => ({
  i18nSetup: vi.fn(),
  i18n: { t: vi.fn((key: string) => key) },
}));

vi.mock('@embeddable.com/react', () => ({ useTheme: vi.fn().mockReturnValue({}) }));

vi.mock('@tabler/icons-react', () => ({
  IconPlus: () => <span data-testid="icon-plus" />,
  IconChevronRight: () => <span data-testid="icon-chevron-right" />,
  IconChevronLeft: () => <span data-testid="icon-chevron-left" />,
}));

vi.mock('@embeddable.com/remarkable-ui', () => ({
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
}));

vi.mock('./components/FilterBuilderWithGroupingItem', () => ({
  default: ({
    filter,
    onSelectDimensionOrMeasure,
    onSelectOperator,
    onSelectValue,
    onDelete,
    onCreateGroup,
  }: {
    filter: FilterBuilderFilter;
    onSelectDimensionOrMeasure: (v: string | null) => void;
    onSelectOperator: (v: string | null) => void;
    onSelectValue: (v: FilterBuilderFilter['value']) => void;
    onDelete: () => void;
    onCreateGroup?: (v: string | null) => void;
  }) => (
    <div data-testid={`filter-item-${filter.id}`}>
      <button
        data-testid={`select-dim-${filter.id}`}
        onClick={() => onSelectDimensionOrMeasure('country')}
      >
        dim
      </button>
      <button data-testid={`select-op-${filter.id}`} onClick={() => onSelectOperator('is')}>
        op
      </button>
      <button data-testid={`select-val-${filter.id}`} onClick={() => onSelectValue('France')}>
        val
      </button>
      <button data-testid={`delete-${filter.id}`} onClick={onDelete}>
        del
      </button>
      {onCreateGroup && (
        <button data-testid={`create-group-${filter.id}`} onClick={() => onCreateGroup('revenue')}>
          group
        </button>
      )}
    </div>
  ),
}));

vi.mock('./components/FilterBuilderWithGroupingGroup', () => ({
  default: ({
    group,
    onAddFilter,
    onDeleteFilter,
    onOperatorChange,
    onSelectDimensionOrMeasure,
    onSelectOperator,
    onSelectValue,
    onSearchValue,
  }: {
    group: { id: number; filters: FilterBuilderFilter[] };
    onAddFilter: (v: string | null) => void;
    onDeleteFilter: (filterId: number) => void;
    onOperatorChange: (v: string) => void;
    onSelectDimensionOrMeasure: (filterId: number, v: string | null) => void;
    onSelectOperator: (filterId: number, v: string | null) => void;
    onSelectValue: (filterId: number, v: FilterBuilderFilter['value']) => void;
    onSearchValue: (filterId: number, v: string) => void;
  }) => {
    const firstFilterId = group.filters[0]!.id;
    return (
      <div data-testid={`group-${group.id}`}>
        <button data-testid={`group-add-${group.id}`} onClick={() => onAddFilter('country')}>
          add
        </button>
        <button data-testid={`group-del-${group.id}`} onClick={() => onDeleteFilter(firstFilterId)}>
          del
        </button>
        <button data-testid={`group-op-${group.id}`} onClick={() => onOperatorChange('or')}>
          op
        </button>
        <button
          data-testid={`group-seldim-${group.id}`}
          onClick={() => onSelectDimensionOrMeasure(firstFilterId, 'country')}
        >
          seldim
        </button>
        <button
          data-testid={`group-selop-${group.id}`}
          onClick={() => onSelectOperator(firstFilterId, 'is')}
        >
          selop
        </button>
        <button
          data-testid={`group-selval-${group.id}`}
          onClick={() => onSelectValue(firstFilterId, 'France')}
        >
          selval
        </button>
        <button
          data-testid={`group-search-${group.id}`}
          onClick={() => onSearchValue(firstFilterId, 'fr')}
        >
          search
        </button>
      </div>
    );
  },
}));

vi.mock('./components/FilterBuilderWithGroupingAndOrButton', () => ({
  FilterBuilderWithGroupingAndOrButton: ({
    operator,
    onChange,
    disabled,
  }: {
    operator: string;
    onChange: (v: string) => void;
    disabled?: boolean;
  }) => (
    <button
      data-testid="andor"
      data-operator={operator}
      disabled={disabled}
      onClick={() => onChange('or')}
    >
      {operator}
    </button>
  ),
}));

vi.mock('../../shared/EditorCard/EditorCard', () => ({
  EditorCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../utils/dimensionsAndMeasures.utils', () => ({
  getDimensionAndMeasureOptions: vi.fn(() => [{ value: 'country', label: 'Country' }]),
}));

vi.mock('../../../component.utils', () => ({ resolveI18nProps: vi.fn((props) => props) }));

const makeDim = (
  name = 'country',
  type: 'dimension' | 'measure' = 'dimension',
): DimensionOrMeasure =>
  ({
    name,
    title: name,
    nativeType: type === 'measure' ? 'number' : 'string',
    __type__: type,
  }) as unknown as DimensionOrMeasure;

const makeFilter = (o: Partial<FilterBuilderFilter> = {}): FilterBuilderFilter => ({
  id: 1,
  dimensionOrMeasure: null,
  search: '',
  value: null,
  operator: null,
  ...o,
});

const defaultProps = {
  dimensionsAndMeasures: [makeDim('country'), makeDim('revenue', 'measure')],
  setEmbeddableState: vi.fn(),
  onChange: vi.fn(),
};

const applyUpdater = (
  mock: ReturnType<typeof vi.fn>,
  prev: FilterBuilderGroupingState,
): FilterBuilderGroupingState => {
  const updater = mock.mock.calls.at(-1)?.[0];
  return typeof updater === 'function' ? updater(prev) : updater;
};

const itemsOf = (s: FilterBuilderGroupingState): FilterBuilderNode[] => s.items ?? [];

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.ResizeObserver = vi.fn().mockImplementation(function () {
    return { observe: vi.fn(), disconnect: vi.fn() };
  }) as unknown as typeof ResizeObserver;
  Element.prototype.scrollBy = vi.fn();
  Element.prototype.scrollTo = vi.fn();
});

afterEach(() => vi.restoreAllMocks());

describe('FilterBuilderWithGroupingPro', () => {
  it('renders one placeholder filter when empty', () => {
    render(<FilterBuilderWithGroupingPro {...defaultProps} />);
    expect(screen.getByTestId('filter-item-1')).toBeInTheDocument();
  });

  it('renders an item per top-level node', () => {
    const embeddableState: FilterBuilderGroupingState = {
      operator: filterBuilderAndOrOperator.AND,
      items: [makeFilter({ id: 1 }), makeFilter({ id: 2 })],
    };
    render(<FilterBuilderWithGroupingPro {...defaultProps} embeddableState={embeddableState} />);
    expect(screen.getByTestId('filter-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('filter-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('andor')).toBeInTheDocument();
  });

  it('renders a group node via the group container', () => {
    const embeddableState: FilterBuilderGroupingState = {
      operator: filterBuilderAndOrOperator.AND,
      items: [{ id: 5, operator: 'or', filters: [makeFilter({ id: 1 })] }],
    };
    render(<FilterBuilderWithGroupingPro {...defaultProps} embeddableState={embeddableState} />);
    expect(screen.getByTestId('group-5')).toBeInTheDocument();
  });

  it('selecting a member on the initial placeholder persists it', () => {
    render(<FilterBuilderWithGroupingPro {...defaultProps} />);
    fireEvent.click(screen.getByTestId('select-dim-1'));
    const next = applyUpdater(defaultProps.setEmbeddableState, {
      operator: filterBuilderAndOrOperator.AND,
    });
    expect(itemsOf(next)).toHaveLength(1);
    expect((itemsOf(next)[0] as FilterBuilderFilter).dimensionOrMeasure?.name).toBe('country');
  });

  it('creates a group (original + picked second filter) via create-group', () => {
    const prev: FilterBuilderGroupingState = {
      operator: filterBuilderAndOrOperator.AND,
      items: [
        makeFilter({ id: 1, dimensionOrMeasure: makeDim('country'), operator: 'is', value: 'AU' }),
      ],
    };
    render(<FilterBuilderWithGroupingPro {...defaultProps} embeddableState={prev} />);
    fireEvent.click(screen.getByTestId('create-group-1'));
    const next = applyUpdater(defaultProps.setEmbeddableState, prev);
    const grp = itemsOf(next)[0] as { operator: string; filters: FilterBuilderFilter[] };
    expect(grp.filters).toHaveLength(2);
    expect(grp.filters[1]!.dimensionOrMeasure?.name).toBe('revenue');
  });

  it('deletes a top-level item', () => {
    const prev: FilterBuilderGroupingState = {
      operator: filterBuilderAndOrOperator.AND,
      items: [makeFilter({ id: 1 }), makeFilter({ id: 2 })],
    };
    render(<FilterBuilderWithGroupingPro {...defaultProps} embeddableState={prev} />);
    fireEvent.click(screen.getByTestId('delete-1'));
    const next = applyUpdater(defaultProps.setEmbeddableState, prev);
    expect(itemsOf(next)).toHaveLength(1);
    expect((itemsOf(next)[0] as FilterBuilderFilter).id).toBe(2);
  });

  it('adds a filter to a group and can delete one', () => {
    const prev: FilterBuilderGroupingState = {
      operator: filterBuilderAndOrOperator.AND,
      items: [
        {
          id: 5,
          operator: 'and',
          filters: [
            makeFilter({ id: 1, dimensionOrMeasure: makeDim('country') }),
            makeFilter({ id: 2, dimensionOrMeasure: makeDim('country') }),
          ],
        },
      ],
    };
    render(<FilterBuilderWithGroupingPro {...defaultProps} embeddableState={prev} />);
    fireEvent.click(screen.getByTestId('group-add-5'));
    const added = applyUpdater(defaultProps.setEmbeddableState, prev);
    expect((added.items![0] as { filters: FilterBuilderFilter[] }).filters).toHaveLength(3);
  });

  it('appends a top-level filter from the add-filter dropdown', () => {
    const prev: FilterBuilderGroupingState = {
      operator: filterBuilderAndOrOperator.AND,
      items: [makeFilter({ id: 3, dimensionOrMeasure: makeDim('country') })],
    };
    render(<FilterBuilderWithGroupingPro {...defaultProps} embeddableState={prev} />);
    fireEvent.click(screen.getByTestId('add-option-country'));
    const next = applyUpdater(defaultProps.setEmbeddableState, prev);
    expect(itemsOf(next)).toHaveLength(2);
    expect((itemsOf(next)[1] as FilterBuilderFilter).id).toBe(4);
  });

  it('clears all to a single empty filter', () => {
    const prev: FilterBuilderGroupingState = {
      operator: filterBuilderAndOrOperator.OR,
      items: [
        makeFilter({ id: 1, dimensionOrMeasure: makeDim('country'), operator: 'is', value: 'AU' }),
      ],
    };
    render(<FilterBuilderWithGroupingPro {...defaultProps} embeddableState={prev} />);
    fireEvent.click(screen.getByText('editors.filterBuilder.clearAll'));
    const next = applyUpdater(defaultProps.setEmbeddableState, prev);
    expect(itemsOf(next)).toHaveLength(1);
    expect((itemsOf(next)[0] as FilterBuilderFilter).dimensionOrMeasure).toBeNull();
  });

  it('emits an onChange clause for a complete filter', () => {
    const embeddableState: FilterBuilderGroupingState = {
      operator: filterBuilderAndOrOperator.AND,
      items: [
        makeFilter({ id: 1, dimensionOrMeasure: makeDim('country'), operator: 'is', value: 'AU' }),
      ],
    };
    render(<FilterBuilderWithGroupingPro {...defaultProps} embeddableState={embeddableState} />);
    expect(defaultProps.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ operator: 'and', clauses: expect.any(Array) }),
    );
  });

  it('handles group-level edits (operator, member, operator, value, search, delete)', () => {
    const groupState = (): FilterBuilderGroupingState => ({
      operator: filterBuilderAndOrOperator.AND,
      items: [
        {
          id: 5,
          operator: 'and',
          filters: [
            makeFilter({ id: 1, dimensionOrMeasure: makeDim('country') }),
            makeFilter({ id: 2, dimensionOrMeasure: makeDim('country') }),
          ],
        },
      ],
    });
    render(<FilterBuilderWithGroupingPro {...defaultProps} embeddableState={groupState()} />);

    fireEvent.click(screen.getByTestId('group-op-5'));
    expect(
      (
        applyUpdater(defaultProps.setEmbeddableState, groupState()).items![0] as {
          operator: string;
        }
      ).operator,
    ).toBe('or');

    fireEvent.click(screen.getByTestId('group-selop-5'));
    const opEdited = applyUpdater(defaultProps.setEmbeddableState, groupState()).items![0] as {
      filters: FilterBuilderFilter[];
    };
    expect(opEdited.filters[0]!.operator).toBe('is');

    fireEvent.click(screen.getByTestId('group-selval-5'));
    const valEdited = applyUpdater(defaultProps.setEmbeddableState, groupState()).items![0] as {
      filters: FilterBuilderFilter[];
    };
    expect(valEdited.filters[0]!.value).toBe('France');

    fireEvent.click(screen.getByTestId('group-search-5'));
    const searchEdited = applyUpdater(defaultProps.setEmbeddableState, groupState()).items![0] as {
      filters: FilterBuilderFilter[];
    };
    expect(searchEdited.filters[0]!.search).toBe('fr');

    fireEvent.click(screen.getByTestId('group-del-5'));
    // deleting one of two collapses the group back to a single top-level filter
    const afterDelete = applyUpdater(defaultProps.setEmbeddableState, groupState());
    expect(afterDelete.items![0]).toMatchObject({ id: 2 });
  });

  it('targets a group filter by its stable id, not its array position (regression)', () => {
    // The filter carrying id 99 is deliberately placed first in the array so a
    // position-based ("index 0") dispatch and an id-based dispatch would only
    // coincide by accident here — using an id that doesn't double as a valid
    // index (99) proves the update is keyed by id.
    const state: FilterBuilderGroupingState = {
      operator: filterBuilderAndOrOperator.AND,
      items: [
        {
          id: 7,
          operator: 'and',
          filters: [
            makeFilter({ id: 99, dimensionOrMeasure: makeDim('country'), value: 'UK' }),
            makeFilter({ id: 1, dimensionOrMeasure: makeDim('country'), value: 'AU' }),
          ],
        },
      ],
    };
    render(<FilterBuilderWithGroupingPro {...defaultProps} embeddableState={state} />);

    fireEvent.click(screen.getByTestId('group-selval-7'));

    const next = applyUpdater(defaultProps.setEmbeddableState, state);
    const group = next.items![0] as { filters: FilterBuilderFilter[] };
    expect(group.filters.find((f) => f.id === 99)!.value).toBe('France');
    expect(group.filters.find((f) => f.id === 1)!.value).toBe('AU');
  });

  it('toggles the top-level operator', () => {
    const prev: FilterBuilderGroupingState = {
      operator: filterBuilderAndOrOperator.AND,
      items: [
        makeFilter({ id: 1, dimensionOrMeasure: makeDim('country'), operator: 'is', value: 'AU' }),
        makeFilter({ id: 2, dimensionOrMeasure: makeDim('country'), operator: 'is', value: 'UK' }),
      ],
    };
    render(<FilterBuilderWithGroupingPro {...defaultProps} embeddableState={prev} />);
    fireEvent.click(screen.getByTestId('andor'));
    expect(applyUpdater(defaultProps.setEmbeddableState, prev).operator).toBe('or');
  });

  it('renders the scroll-right button and scrolls on overflow', () => {
    render(<FilterBuilderWithGroupingPro {...defaultProps} />);
    const scroll = document.querySelector('.scroll')!;
    Object.defineProperty(scroll, 'scrollLeft', { value: 0, configurable: true });
    Object.defineProperty(scroll, 'clientWidth', { value: 100, configurable: true });
    Object.defineProperty(scroll, 'scrollWidth', { value: 300, configurable: true });
    fireEvent.scroll(scroll);
    fireEvent.click(screen.getByTestId('icon-chevron-right').closest('button')!);
    expect(Element.prototype.scrollBy).toHaveBeenCalledWith({ left: 200, behavior: 'smooth' });
  });

  it('clamps a mixed dimension+measure OR to AND (never emits OR)', () => {
    const embeddableState: FilterBuilderGroupingState = {
      operator: filterBuilderAndOrOperator.OR,
      items: [
        makeFilter({ id: 1, dimensionOrMeasure: makeDim('country'), operator: 'is', value: 'AU' }),
        makeFilter({
          id: 2,
          dimensionOrMeasure: makeDim('revenue', 'measure'),
          operator: 'gt',
          value: 10,
        }),
      ],
    };
    render(<FilterBuilderWithGroupingPro {...defaultProps} embeddableState={embeddableState} />);
    expect(defaultProps.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ operator: filterBuilderAndOrOperator.AND }),
    );
  });

  it('seeds from defaultFilters when empty', () => {
    const defaultFilters: FilterBuilderClause = {
      operator: filterBuilderAndOrOperator.AND,
      clauses: [{ property: 'country', operator: 'equals' as never, value: 'AU' }],
    };
    render(
      <FilterBuilderWithGroupingPro
        {...defaultProps}
        dimensionsAndMeasures={[makeDim('country')]}
        defaultFilters={defaultFilters}
      />,
    );
    const next = applyUpdater(defaultProps.setEmbeddableState, {
      operator: filterBuilderAndOrOperator.AND,
    });
    expect(itemsOf(next).length).toBeGreaterThan(0);
  });

  it('preserves a top-level OR when seeding from defaultFilters, not just AND (regression)', () => {
    const defaultFilters: FilterBuilderClause = {
      operator: filterBuilderAndOrOperator.OR,
      clauses: [
        { property: 'country', operator: 'equals' as never, value: 'AU' },
        { property: 'country', operator: 'equals' as never, value: 'NZ' },
      ],
    };
    render(
      <FilterBuilderWithGroupingPro
        {...defaultProps}
        dimensionsAndMeasures={[makeDim('country')]}
        defaultFilters={defaultFilters}
      />,
    );
    const next = applyUpdater(defaultProps.setEmbeddableState, {
      operator: filterBuilderAndOrOperator.AND,
    });
    expect(next.operator).toBe(filterBuilderAndOrOperator.OR);
  });
});
