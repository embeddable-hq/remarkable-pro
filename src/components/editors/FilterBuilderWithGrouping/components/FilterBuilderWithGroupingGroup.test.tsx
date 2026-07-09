import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FilterBuilderWithGroupingGroup } from './FilterBuilderWithGroupingGroup';
import type { DimensionOrMeasure } from '@embeddable.com/core';
import type { FilterBuilderFilter } from '../../utils/filterBuilder.utils';
import { filterBuilderAndOrOperator } from '../../utils/filterBuilder.utils';
import type { FilterBuilderGroup } from '../FilterBuilderWithGrouping.utils';
import { Theme } from '../../../../theme/theme.types';

vi.mock('../FilterBuilderWithGrouping.module.css', () => ({
  default: {
    group: 'group',
    filter: 'filter',
    createGroupButton: 'createGroupButton',
    roundedRight: 'roundedRight',
  },
}));

vi.mock('../../../../theme/i18n/i18n', () => ({ i18n: { t: vi.fn((k: string) => k) } }));

vi.mock('@tabler/icons-react', () => ({ IconPlus: () => <span data-testid="icon-plus" /> }));

vi.mock('@embeddable.com/remarkable-ui', async () => {
  const { TooltipMock } = await import('../test-utils');
  return {
    Tooltip: TooltipMock,
    SingleSelectField: ({
      triggerComponent,
      onChange,
      options,
    }: {
      triggerComponent: React.ReactNode;
      onChange: (v: string | null) => void;
      options: { value: string; label: string }[];
    }) => (
      <div data-testid="group-add-select">
        {triggerComponent}
        {options.map((o) => (
          <button
            key={o.value}
            data-testid={`group-add-${o.value}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    ),
  };
});

vi.mock('../../utils/dimensionsAndMeasures.utils', () => ({
  getDimensionAndMeasureOptions: vi.fn(
    ({ dimensionsAndMeasures }: { dimensionsAndMeasures: { name: string }[] }) =>
      dimensionsAndMeasures.map((d) => ({ value: d.name, label: d.name })),
  ),
}));

vi.mock('./FilterBuilderWithGroupingItem', () => ({
  default: ({
    filter,
    inGroup,
    onDelete,
  }: {
    filter: FilterBuilderFilter;
    inGroup?: boolean;
    onDelete: () => void;
  }) => (
    <div data-testid={`group-filter-${filter.id}`} data-in-group={String(inGroup)}>
      <button data-testid={`group-delete-${filter.id}`} onClick={onDelete}>
        del
      </button>
    </div>
  ),
}));

vi.mock('./FilterBuilderWithGroupingAndOrButton', () => ({
  FilterBuilderWithGroupingAndOrButton: ({
    operator,
    disabled,
  }: {
    operator: string;
    disabled?: boolean;
  }) => (
    <button data-testid="group-andor" data-operator={operator} disabled={disabled}>
      {operator}
    </button>
  ),
}));

const makeDim = (name: string, type: 'dimension' | 'measure' = 'dimension'): DimensionOrMeasure =>
  ({
    name,
    title: name,
    nativeType: type === 'measure' ? 'number' : 'string',
    __type__: type,
  }) as unknown as DimensionOrMeasure;

const makeFilter = (
  id: number,
  member: DimensionOrMeasure = makeDim('city'),
): FilterBuilderFilter => ({
  id,
  dimensionOrMeasure: member,
  search: '',
  value: 'x',
  operator: 'is',
});

const makeGroup = (o: Partial<FilterBuilderGroup> = {}): FilterBuilderGroup => ({
  id: 10,
  operator: filterBuilderAndOrOperator.OR,
  filters: [makeFilter(1), makeFilter(2)],
  ...o,
});

const defaultProps = {
  group: makeGroup(),
  dimensionsAndMeasures: [makeDim('city')],
  theme: {} as Theme,
  disableOr: false,
  results: vi.fn(() => undefined),
  onOperatorChange: vi.fn(),
  onSelectDimensionOrMeasure: vi.fn(),
  onSelectOperator: vi.fn(),
  onSelectValue: vi.fn(),
  onSearchValue: vi.fn(),
  onDeleteFilter: vi.fn(),
  onAddFilter: vi.fn(),
};

describe('FilterBuilderWithGroupingGroup', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders each filter as in-group with one AND/OR between them', () => {
    render(<FilterBuilderWithGroupingGroup {...defaultProps} />);
    expect(screen.getByTestId('group-filter-1')).toHaveAttribute('data-in-group', 'true');
    expect(screen.getByTestId('group-filter-2')).toHaveAttribute('data-in-group', 'true');
    expect(screen.getAllByTestId('group-andor')).toHaveLength(1);
  });

  it('renders the add-to-group extender with a tooltip', () => {
    render(<FilterBuilderWithGroupingGroup {...defaultProps} />);
    expect(screen.getByTestId('group-add-select')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
      'editors.filterBuilder.addToFilterGroup',
    );
  });

  it('calls onAddFilter from the extender', () => {
    render(<FilterBuilderWithGroupingGroup {...defaultProps} />);
    fireEvent.click(screen.getByTestId('group-add-city'));
    expect(defaultProps.onAddFilter).toHaveBeenCalledWith('city');
  });

  it('calls onDeleteFilter with the index', () => {
    render(<FilterBuilderWithGroupingGroup {...defaultProps} />);
    fireEvent.click(screen.getByTestId('group-delete-2'));
    expect(defaultProps.onDeleteFilter).toHaveBeenCalledWith(1);
  });

  it('restricts the extender to the group member type', () => {
    render(
      <FilterBuilderWithGroupingGroup
        {...defaultProps}
        group={makeGroup({
          filters: [
            makeFilter(1, makeDim('revenue', 'measure')),
            makeFilter(2, makeDim('revenue', 'measure')),
          ],
        })}
        dimensionsAndMeasures={[makeDim('city'), makeDim('revenue', 'measure')]}
      />,
    );
    expect(screen.getByTestId('group-add-revenue')).toBeInTheDocument();
    expect(screen.queryByTestId('group-add-city')).not.toBeInTheDocument();
  });
});
