import { FilterOperator, NativeDataType } from '@embeddable.com/core';
import type { DimensionOrMeasure } from '@embeddable.com/core';
import {
  clauseToItems,
  filterByMemberType,
  getGroupMemberType,
  getItems,
  getLeafFilters,
  getMaxNodeId,
  isFilterBuilderGroup,
  itemsToClause,
  sanitizeOperators,
  scopeIsMixed,
} from './FilterBuilderWithGrouping.utils';
import type { FilterBuilderGroup, FilterBuilderNode } from './FilterBuilderWithGrouping.utils';
import {
  FilterBuilderClause,
  filterBuilderAndOrOperator,
  FilterBuilderFilter,
  operatorNumber,
  operatorStringBoolean,
} from '../utils/filterBuilder.utils';

const dimension = (name: string): DimensionOrMeasure =>
  ({
    name,
    title: name,
    nativeType: 'string',
    __type__: 'dimension',
  }) as unknown as DimensionOrMeasure;
const measure = (name: string): DimensionOrMeasure =>
  ({
    name,
    title: name,
    nativeType: 'number',
    __type__: 'measure',
  }) as unknown as DimensionOrMeasure;

const leaf = (
  id: number,
  member: DimensionOrMeasure | null,
  overrides: Partial<FilterBuilderFilter> = {},
): FilterBuilderFilter => ({
  id,
  dimensionOrMeasure: member,
  search: '',
  operator: member ? operatorStringBoolean.is : null,
  value: member ? 'x' : null,
  ...overrides,
});

const group = (
  id: number,
  operator: string,
  filters: FilterBuilderFilter[],
): FilterBuilderGroup => ({ id, operator, filters });

describe('isFilterBuilderGroup', () => {
  it('detects groups vs leaves vs nullish', () => {
    expect(isFilterBuilderGroup(group(1, 'and', [leaf(2, dimension('a'))]))).toBe(true);
    expect(isFilterBuilderGroup(leaf(1, dimension('a')))).toBe(false);
    expect(isFilterBuilderGroup(undefined)).toBe(false);
    expect(isFilterBuilderGroup(null)).toBe(false);
  });
});

describe('getItems', () => {
  it('prefers items, falls back to legacy filters, else []', () => {
    const items: FilterBuilderNode[] = [leaf(1, dimension('a'))];
    expect(getItems({ items, operator: 'and' })).toBe(items);
    const filters = [leaf(1, dimension('a'))];
    expect(getItems({ filters, operator: 'and' })).toBe(filters);
    expect(getItems(undefined)).toEqual([]);
    expect(getItems({ operator: 'and' })).toEqual([]);
  });
});

describe('getLeafFilters', () => {
  it('flattens leaves out of groups', () => {
    const items: FilterBuilderNode[] = [
      leaf(1, dimension('a')),
      group(2, 'or', [leaf(3, dimension('b')), leaf(4, dimension('c'))]),
    ];
    expect(getLeafFilters({ items, operator: 'and' }).map((f) => f.id)).toEqual([1, 3, 4]);
  });
});

describe('getMaxNodeId', () => {
  it('considers group ids and child ids', () => {
    expect(getMaxNodeId([leaf(1, dimension('a')), group(2, 'or', [leaf(9, dimension('b'))])])).toBe(
      9,
    );
    expect(getMaxNodeId([])).toBe(0);
  });
});

describe('getGroupMemberType', () => {
  it('returns the type in scope and honours excludeIndex', () => {
    expect(getGroupMemberType([leaf(1, dimension('a'))])).toBe('dimension');
    expect(getGroupMemberType([leaf(1, measure('m'))])).toBe('measure');
    const filters = [leaf(1, measure('m')), leaf(2, null)];
    expect(getGroupMemberType(filters, 0)).toBeNull();
    expect(getGroupMemberType(filters, 1)).toBe('measure');
    expect(getGroupMemberType([leaf(1, null)])).toBeNull();
  });
});

describe('filterByMemberType', () => {
  it('filters by type, passes through when no type', () => {
    const members = [dimension('a'), measure('m'), dimension('b')];
    expect(filterByMemberType(members, 'dimension').map((d) => d.name)).toEqual(['a', 'b']);
    expect(filterByMemberType(members, 'measure').map((d) => d.name)).toEqual(['m']);
    expect(filterByMemberType(members, null)).toHaveLength(3);
    expect(filterByMemberType(members, undefined)).toHaveLength(3);
  });
});

describe('scopeIsMixed', () => {
  it('is true only when both a dimension and a measure are present', () => {
    expect(scopeIsMixed([leaf(1, dimension('a')), leaf(2, measure('m'))])).toBe(true);
    expect(scopeIsMixed([leaf(1, dimension('a')), leaf(2, dimension('b'))])).toBe(false);
    expect(scopeIsMixed([leaf(1, measure('m'))])).toBe(false);
    expect(scopeIsMixed([leaf(1, null)])).toBe(false);
  });
});

describe('itemsToClause', () => {
  it('wraps a group as nested clause under the top operator', () => {
    const items: FilterBuilderNode[] = [
      leaf(1, dimension('a')),
      group(2, 'or', [leaf(3, dimension('b')), leaf(4, dimension('c'))]),
    ];
    const clause = itemsToClause('and', items) as Extract<
      FilterBuilderClause,
      { clauses: FilterBuilderClause[] }
    >;
    expect(clause.operator).toBe('and');
    expect(clause.clauses).toHaveLength(2);
    const nested = clause.clauses[1] as Extract<
      FilterBuilderClause,
      { clauses: FilterBuilderClause[] }
    >;
    expect(nested.operator).toBe('or');
    expect(nested.clauses).toHaveLength(2);
  });

  it('flattens a single-filter group to a bare clause', () => {
    const clause = itemsToClause('and', [group(2, 'and', [leaf(3, dimension('b'))])]) as Extract<
      FilterBuilderClause,
      { clauses: FilterBuilderClause[] }
    >;
    expect('clauses' in clause.clauses[0]!).toBe(false);
  });

  it('drops incomplete leaves and returns null when empty', () => {
    expect(itemsToClause('and', [leaf(1, dimension('a'), { value: null })])).toBeNull();
    expect(
      itemsToClause('and', [group(2, 'and', [leaf(3, dimension('b'), { value: null })])]),
    ).toBeNull();
  });
});

describe('clauseToItems', () => {
  const dims = [dimension('a'), dimension('b'), dimension('c')];

  it('round-trips a top-level filter + group', () => {
    const items: FilterBuilderNode[] = [
      leaf(1, dimension('a')),
      group(2, 'or', [leaf(3, dimension('b')), leaf(4, dimension('c'))]),
    ];
    const restored = clauseToItems(itemsToClause('and', items), dims);
    expect(restored).toHaveLength(2);
    expect(isFilterBuilderGroup(restored[0])).toBe(false);
    expect(isFilterBuilderGroup(restored[1])).toBe(true);
    expect((restored[1] as FilterBuilderGroup).operator).toBe('or');
    expect((restored[1] as FilterBuilderGroup).filters).toHaveLength(2);
  });

  it('maps a between gte/lte pair back to a single filter', () => {
    const clause: FilterBuilderClause = {
      operator: 'and',
      clauses: [
        {
          operator: filterBuilderAndOrOperator.AND,
          clauses: [
            { property: 'age', operator: FilterOperator.gte, value: 20 },
            { property: 'age', operator: FilterOperator.lte, value: 40 },
          ],
        },
      ],
    };
    const restored = clauseToItems(clause, [
      {
        name: 'age',
        title: 'age',
        nativeType: NativeDataType.number,
        __type__: 'dimension',
      } as unknown as DimensionOrMeasure,
    ]);
    expect(restored).toHaveLength(1);
    expect(isFilterBuilderGroup(restored[0])).toBe(false);
    expect((restored[0] as FilterBuilderFilter).operator).toBe(operatorNumber.between);
  });

  it('returns [] for null', () => {
    expect(clauseToItems(null, dims)).toEqual([]);
  });
});

describe('sanitizeOperators', () => {
  it('clamps a mixed group OR to AND', () => {
    const items: FilterBuilderNode[] = [
      group(1, 'or', [leaf(2, dimension('a')), leaf(3, measure('m'))]),
    ];
    const result = sanitizeOperators(items, 'and');
    expect(result.changed).toBe(true);
    expect((result.items[0] as FilterBuilderGroup).operator).toBe('and');
  });

  it('clamps a mixed top-level OR to AND', () => {
    const items: FilterBuilderNode[] = [leaf(1, dimension('a')), leaf(2, measure('m'))];
    const result = sanitizeOperators(items, 'or');
    expect(result.changed).toBe(true);
    expect(result.operator).toBe('and');
  });

  it('leaves same-type OR untouched', () => {
    const items: FilterBuilderNode[] = [leaf(1, measure('m1')), leaf(2, measure('m2'))];
    const result = sanitizeOperators(items, 'or');
    expect(result.changed).toBe(false);
    expect(result.operator).toBe('or');
  });
});
