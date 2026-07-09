import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import FilterBuilderWithGroupingItem from './FilterBuilderWithGroupingItem';
import type { DimensionOrMeasure } from '@embeddable.com/core';
import type { FilterBuilderFilter } from '../../filters.utils';
import { Theme } from '../../../../../theme/theme.types';

vi.mock('../FilterBuilderWithGroupingPro.module.css', () => ({
  default: {
    filter: 'filter',
    memberButton: 'memberButton',
    addButton: 'addButton',
    deleteButton: 'deleteButton',
    createGroupButton: 'createGroupButton',
    roundedRight: 'roundedRight',
  },
}));

vi.mock('../../../../../theme/i18n/i18n', () => ({ i18n: { t: vi.fn((k: string) => k) } }));

vi.mock('@tabler/icons-react', () => ({
  IconPlus: () => <span data-testid="icon-plus" />,
  IconX: () => <span data-testid="icon-x" />,
}));

vi.mock('@embeddable.com/remarkable-ui', async () => {
  const { TooltipMock } = await import('../../test-utils');
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
      <div data-testid="select">
        {triggerComponent}
        {options.map((o) => (
          <button key={o.value} data-testid={`option-${o.value}`} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    ),
  };
});

vi.mock('../../../utils/dimensionsAndMeasures.utils', () => ({
  getDimensionAndMeasureOptions: vi.fn(
    ({ dimensionsAndMeasures }: { dimensionsAndMeasures: { name: string }[] }) =>
      dimensionsAndMeasures.map((d) => ({ value: d.name, label: d.name })),
  ),
}));

vi.mock('../../components/FilterBuilderItemOperatorValueFields', () => ({
  default: () => <div data-testid="operator-value-fields" />,
}));

const makeDim = (name: string, type: 'dimension' | 'measure' = 'dimension'): DimensionOrMeasure =>
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
  filter: makeFilter(),
  dimensionsAndMeasures: [makeDim('country'), makeDim('revenue', 'measure')],
  theme: {} as Theme,
  onSelectDimensionOrMeasure: vi.fn(),
  onSelectOperator: vi.fn(),
  onSelectValue: vi.fn(),
  onSearchValue: vi.fn(),
  onDelete: vi.fn(),
};

describe('FilterBuilderWithGroupingItem', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the add-filter button when no member is selected', () => {
    render(<FilterBuilderWithGroupingItem {...defaultProps} />);
    expect(screen.getByText('editors.filterBuilder.addFilter')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-x')).not.toBeInTheDocument();
  });

  it('shows operator/value fields and delete when a member is selected', () => {
    render(
      <FilterBuilderWithGroupingItem
        {...defaultProps}
        filter={makeFilter({ dimensionOrMeasure: makeDim('country') })}
      />,
    );
    expect(screen.getByTestId('operator-value-fields')).toBeInTheDocument();
    expect(screen.getByTestId('icon-x')).toBeInTheDocument();
  });

  it('shows create-group only at top level and calls it with the picked member', () => {
    const onCreateGroup = vi.fn();
    render(
      <FilterBuilderWithGroupingItem
        {...defaultProps}
        filter={makeFilter({ dimensionOrMeasure: makeDim('country') })}
        onCreateGroup={onCreateGroup}
      />,
    );
    const menu = document.querySelector('.createGroupButton')!.closest('[data-testid="select"]')!;
    // The trigger filter is a dimension, so create-group only offers dimensions.
    fireEvent.click(within(menu as HTMLElement).getByTestId('option-country'));
    expect(onCreateGroup).toHaveBeenCalledWith('country');
  });

  it('hides create-group when inside a group', () => {
    render(
      <FilterBuilderWithGroupingItem
        {...defaultProps}
        inGroup
        filter={makeFilter({ dimensionOrMeasure: makeDim('country') })}
        onCreateGroup={vi.fn()}
      />,
    );
    expect(document.querySelector('.createGroupButton')).not.toBeInTheDocument();
  });

  it('restricts member options to allowedMemberType', () => {
    render(<FilterBuilderWithGroupingItem {...defaultProps} inGroup allowedMemberType="measure" />);
    // member picker is the first select; only the measure should be offered
    expect(screen.getByTestId('option-revenue')).toBeInTheDocument();
    expect(screen.queryByTestId('option-country')).not.toBeInTheDocument();
  });

  it('calls onDelete when delete is clicked', () => {
    render(
      <FilterBuilderWithGroupingItem
        {...defaultProps}
        filter={makeFilter({ dimensionOrMeasure: makeDim('country') })}
      />,
    );
    fireEvent.click(screen.getByTestId('icon-x').closest('button')!);
    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
  });
});
