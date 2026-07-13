import { FilterOperator, NativeDataType } from '@embeddable.com/core';
import type { DimensionOrMeasure } from '@embeddable.com/core';
import {
  clauseToItems,
  filterByMemberType,
  getAllFilters,
  getFilterNodes,
  getGroupMemberType,
  getHighestNodeId,
  isFilterBuilderGroup,
  itemsToClause,
  sanitizeMixedTypeOperators,
} from './FilterBuilderWithGroupingPro.utils';
import type { FilterBuilderGroup, FilterBuilderNode } from './FilterBuilderWithGroupingPro.utils';
import {
  FilterBuilderClause,
  filterBuilderAndOrOperator,
  FilterBuilderFilter,
  operatorNumber,
  operatorStringBoolean,
} from '../filters.utils';

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

const makeFilter = (
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
  it('detects groups vs plain filters vs nullish', () => {
    expect(isFilterBuilderGroup(group(1, 'and', [makeFilter(2, dimension('a'))]))).toBe(true);
    expect(isFilterBuilderGroup(makeFilter(1, dimension('a')))).toBe(false);
    expect(isFilterBuilderGroup(undefined)).toBe(false);
    expect(isFilterBuilderGroup(null)).toBe(false);
  });
});

describe('getFilterNodes', () => {
  it('prefers items, falls back to legacy filters, else []', () => {
    const items: FilterBuilderNode[] = [makeFilter(1, dimension('a'))];
    expect(getFilterNodes({ items, operator: 'and' })).toBe(items);
    const filters = [makeFilter(1, dimension('a'))];
    expect(getFilterNodes({ filters, operator: 'and' })).toBe(filters);
    expect(getFilterNodes(undefined)).toEqual([]);
    expect(getFilterNodes({ operator: 'and' })).toEqual([]);
  });
});

describe('getAllFilters', () => {
  it('flattens filters out of groups', () => {
    const items: FilterBuilderNode[] = [
      makeFilter(1, dimension('a')),
      group(2, 'or', [makeFilter(3, dimension('b')), makeFilter(4, dimension('c'))]),
    ];
    expect(getAllFilters({ items, operator: 'and' }).map((f) => f.id)).toEqual([1, 3, 4]);
  });
});

describe('getHighestNodeId', () => {
  it('considers group ids and child ids', () => {
    expect(
      getHighestNodeId([
        makeFilter(1, dimension('a')),
        group(2, 'or', [makeFilter(9, dimension('b'))]),
      ]),
    ).toBe(9);
    expect(getHighestNodeId([])).toBe(0);
  });
});

describe('getGroupMemberType', () => {
  it('returns the type in scope and honours excludeIndex', () => {
    expect(getGroupMemberType([makeFilter(1, dimension('a'))])).toBe('dimension');
    expect(getGroupMemberType([makeFilter(1, measure('m'))])).toBe('measure');
    const filters = [makeFilter(1, measure('m')), makeFilter(2, null)];
    expect(getGroupMemberType(filters, 0)).toBeNull();
    expect(getGroupMemberType(filters, 1)).toBe('measure');
    expect(getGroupMemberType([makeFilter(1, null)])).toBeNull();
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

describe('itemsToClause', () => {
  it('wraps a group as nested clause under the top operator', () => {
    const items: FilterBuilderNode[] = [
      makeFilter(1, dimension('a')),
      group(2, 'or', [makeFilter(3, dimension('b')), makeFilter(4, dimension('c'))]),
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
    const clause = itemsToClause('and', [
      group(2, 'and', [makeFilter(3, dimension('b'))]),
    ]) as Extract<FilterBuilderClause, { clauses: FilterBuilderClause[] }>;
    expect('clauses' in clause.clauses[0]!).toBe(false);
  });

  it('drops incomplete leaves and returns null when empty', () => {
    expect(itemsToClause('and', [makeFilter(1, dimension('a'), { value: null })])).toBeNull();
    expect(
      itemsToClause('and', [group(2, 'and', [makeFilter(3, dimension('b'), { value: null })])]),
    ).toBeNull();
  });

  it('keeps a single-filter group wrapped when the filter is a "between" range, to avoid colliding with a plain top-level between-filter', () => {
    const age = {
      name: 'age',
      title: 'age',
      nativeType: NativeDataType.number,
      __type__: 'dimension',
    } as unknown as DimensionOrMeasure;
    const betweenFilter = makeFilter(3, age, { operator: operatorNumber.between, value: [20, 40] });

    const clause = itemsToClause('and', [group(2, 'and', [betweenFilter])]) as Extract<
      FilterBuilderClause,
      { clauses: FilterBuilderClause[] }
    >;

    // Still a group (one clause), not flattened to a bare between clause.
    expect(clause.clauses).toHaveLength(1);
    const groupClause = clause.clauses[0] as Extract<
      FilterBuilderClause,
      { clauses: FilterBuilderClause[] }
    >;
    expect('clauses' in groupClause).toBe(true);
    expect(groupClause.clauses).toHaveLength(1);
  });
});

describe('clauseToItems', () => {
  const dims = [dimension('a'), dimension('b'), dimension('c')];

  it('round-trips a top-level filter + group', () => {
    const items: FilterBuilderNode[] = [
      makeFilter(1, dimension('a')),
      group(2, 'or', [makeFilter(3, dimension('b')), makeFilter(4, dimension('c'))]),
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

  it('round-trips a single-filter group whose filter is a "between" range without losing its group identity', () => {
    const age = {
      name: 'age',
      title: 'age',
      nativeType: NativeDataType.number,
      __type__: 'dimension',
    } as unknown as DimensionOrMeasure;
    const betweenFilter = makeFilter(3, age, { operator: operatorNumber.between, value: [20, 40] });

    const clause = itemsToClause('and', [group(2, 'and', [betweenFilter])]);
    const restored = clauseToItems(clause, [age]);

    expect(restored).toHaveLength(1);
    expect(isFilterBuilderGroup(restored[0])).toBe(true);
    const restoredGroup = restored[0] as FilterBuilderGroup;
    expect(restoredGroup.filters).toHaveLength(1);
    expect(restoredGroup.filters[0]!.operator).toBe(operatorNumber.between);
    expect(restoredGroup.filters[0]!.value).toEqual([20, 40]);
  });
});

describe('sanitizeMixedTypeOperators', () => {
  it('clamps a mixed group OR to AND', () => {
    const items: FilterBuilderNode[] = [
      group(1, 'or', [makeFilter(2, dimension('a')), makeFilter(3, measure('m'))]),
    ];
    const result = sanitizeMixedTypeOperators(items, 'and');
    expect(result.changed).toBe(true);
    expect((result.items[0] as FilterBuilderGroup).operator).toBe('and');
  });

  it('clamps a mixed top-level OR to AND', () => {
    const items: FilterBuilderNode[] = [makeFilter(1, dimension('a')), makeFilter(2, measure('m'))];
    const result = sanitizeMixedTypeOperators(items, 'or');
    expect(result.changed).toBe(true);
    expect(result.operator).toBe('and');
  });

  it('leaves same-type OR untouched', () => {
    const items: FilterBuilderNode[] = [makeFilter(1, measure('m1')), makeFilter(2, measure('m2'))];
    const result = sanitizeMixedTypeOperators(items, 'or');
    expect(result.changed).toBe(false);
    expect(result.operator).toBe('or');
  });
});
