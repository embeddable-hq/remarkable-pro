import { FilterOperator, NativeDataType } from '@embeddable.com/core';
import type { DimensionOrMeasure } from '@embeddable.com/core';
import {
  clauseToFilter,
  clauseToFilters,
  filterBuilderAndOrOperator,
  filterToLoadDataFilters,
  filtersToClause,
  getMultiSelectDisplayValue,
  getSupportedDimensionsAndMeasures,
  operatorNumber,
  operatorStringBoolean,
} from './filters.utils';
import type { FilterBuilderClause, FilterBuilderFilter } from './filters.utils';

vi.mock('../../../theme/i18n/i18n', () => ({
  i18n: {
    t: vi.fn((key: string, opts?: { count?: number }) => (opts ? `${key}:${opts.count}` : key)),
  },
}));

type ClauseGroup = Extract<FilterBuilderClause, { clauses: FilterBuilderClause[] }>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeDim = (nativeType: string, name = 'myField'): DimensionOrMeasure =>
  ({
    name,
    title: name,
    nativeType,
    __type__: 'dimension',
  }) as unknown as DimensionOrMeasure;

const makeFilter = (overrides: Partial<FilterBuilderFilter> = {}): FilterBuilderFilter => ({
  id: 1,
  dimensionOrMeasure: makeDim(NativeDataType.string),
  search: '',
  value: 'hello',
  operator: operatorStringBoolean.is,
  ...overrides,
});

const generate = (...args: Parameters<typeof filtersToClause>): ClauseGroup | null =>
  filtersToClause(...args) as ClauseGroup | null;

// ---------------------------------------------------------------------------
// filterToLoadDataFilters
// ---------------------------------------------------------------------------

describe('filterToLoadDataFilters', () => {
  it('returns [] for a filter missing dimensionOrMeasure', () => {
    expect(filterToLoadDataFilters(makeFilter({ dimensionOrMeasure: null }))).toEqual([]);
  });

  it('returns [] for a filter missing operator', () => {
    expect(filterToLoadDataFilters(makeFilter({ operator: null }))).toEqual([]);
  });

  it('returns [] for a filter with null value', () => {
    expect(filterToLoadDataFilters(makeFilter({ value: null }))).toEqual([]);
  });

  it('maps a string "is" filter to a single equals load-data filter', () => {
    const result = filterToLoadDataFilters(
      makeFilter({ operator: operatorStringBoolean.is, value: 'Alice' }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ operator: FilterOperator.equals, value: 'Alice' });
  });

  it('maps a string "isNot" filter to notEquals', () => {
    const result = filterToLoadDataFilters(
      makeFilter({ operator: operatorStringBoolean.isNot, value: 'Bob' }),
    );
    expect(result[0]?.operator).toBe(FilterOperator.notEquals);
  });

  it('maps a string "isOneOf" filter to contains', () => {
    const result = filterToLoadDataFilters(
      makeFilter({ operator: operatorStringBoolean.isOneOf, value: ['a', 'b'] }),
    );
    expect(result[0]?.operator).toBe(FilterOperator.contains);
    expect(result[0]?.value).toEqual(['a', 'b']);
  });

  it('maps a string "isNotOneOf" filter to notContains', () => {
    const result = filterToLoadDataFilters(
      makeFilter({ operator: operatorStringBoolean.isNotOneOf, value: ['x'] }),
    );
    expect(result[0]?.operator).toBe(FilterOperator.notContains);
  });

  it('maps a number gte filter correctly', () => {
    const result = filterToLoadDataFilters(
      makeFilter({
        dimensionOrMeasure: makeDim(NativeDataType.number, 'age'),
        operator: operatorNumber.gte,
        value: 18,
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ operator: FilterOperator.gte, value: 18 });
  });

  it('maps a number lte filter correctly', () => {
    const result = filterToLoadDataFilters(
      makeFilter({
        dimensionOrMeasure: makeDim(NativeDataType.number, 'age'),
        operator: operatorNumber.lte,
        value: 65,
      }),
    );
    expect(result[0]?.operator).toBe(FilterOperator.lte);
  });

  it('expands a number "between" filter into gte + lte load-data filters', () => {
    const result = filterToLoadDataFilters(
      makeFilter({
        dimensionOrMeasure: makeDim(NativeDataType.number, 'price'),
        operator: operatorNumber.between,
        value: [10, 50] as unknown as FilterBuilderFilter['value'],
      }),
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ operator: FilterOperator.gte, value: 10 });
    expect(result[1]).toMatchObject({ operator: FilterOperator.lte, value: 50 });
  });

  it('returns [] for an unrecognised operator', () => {
    const result = filterToLoadDataFilters(makeFilter({ operator: 'unknown_op' }));
    expect(result).toEqual([]);
  });

  it('sets the property field to the dimensionOrMeasure object', () => {
    const dim = makeDim(NativeDataType.string, 'country');
    const result = filterToLoadDataFilters(
      makeFilter({ dimensionOrMeasure: dim, operator: operatorStringBoolean.is, value: 'USA' }),
    );
    expect(result[0]?.property).toBe(dim);
  });
});

// ---------------------------------------------------------------------------
// getSupportedDimensionsAndMeasures
// ---------------------------------------------------------------------------

describe('getSupportedDimensionsAndMeasures', () => {
  it('keeps string, number and boolean dimensions', () => {
    const dims = [
      makeDim(NativeDataType.string, 'a'),
      makeDim(NativeDataType.number, 'b'),
      makeDim(NativeDataType.boolean, 'c'),
      makeDim('time', 'd'),
    ];
    const result = getSupportedDimensionsAndMeasures(dims);
    expect(result).toHaveLength(3);
    expect(result.map((d) => d.name)).toEqual(['a', 'b', 'c']);
  });

  it('filters out unsupported types', () => {
    const dims = [makeDim('time', 'a'), makeDim('date', 'b')];
    expect(getSupportedDimensionsAndMeasures(dims)).toHaveLength(0);
  });

  it('returns all items when every type is supported', () => {
    const dims = [makeDim(NativeDataType.string), makeDim(NativeDataType.number)];
    expect(getSupportedDimensionsAndMeasures(dims)).toHaveLength(2);
  });

  it('returns an empty array for empty input', () => {
    expect(getSupportedDimensionsAndMeasures([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// filtersToClause
// ---------------------------------------------------------------------------

describe('filtersToClause', () => {
  it('returns null when filters array is empty', () => {
    expect(generate(filterBuilderAndOrOperator.AND, [])).toBeNull();
  });

  it('returns null when all filters are incomplete (missing operator)', () => {
    const f = makeFilter({ operator: null });
    expect(generate(filterBuilderAndOrOperator.AND, [f])).toBeNull();
  });

  it('returns null when all filters are incomplete (missing dimensionOrMeasure)', () => {
    const f = makeFilter({ dimensionOrMeasure: null });
    expect(generate(filterBuilderAndOrOperator.AND, [f])).toBeNull();
  });

  it('returns null when all filters have null value', () => {
    const f = makeFilter({ value: null });
    expect(generate(filterBuilderAndOrOperator.AND, [f])).toBeNull();
  });

  it('wraps a single clause in the given operator', () => {
    const f = makeFilter({ operator: operatorStringBoolean.is, value: 'foo' });
    const result = generate(filterBuilderAndOrOperator.AND, [f]);
    expect(result).toEqual({
      operator: filterBuilderAndOrOperator.AND,
      clauses: [{ property: 'myField', operator: FilterOperator.equals, value: 'foo' }],
    });
  });

  it('uses OR operator when specified', () => {
    const f = makeFilter({ operator: operatorStringBoolean.is, value: 'foo' });
    const result = generate(filterBuilderAndOrOperator.OR, [f]);
    expect(result?.operator).toBe(filterBuilderAndOrOperator.OR);
  });

  it('skips incomplete filters and keeps complete ones', () => {
    const complete = makeFilter({ operator: operatorStringBoolean.is, value: 'ok' });
    const incomplete = makeFilter({ operator: null });
    const result = generate(filterBuilderAndOrOperator.AND, [complete, incomplete]);
    expect(result?.clauses).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // string / boolean operators
  // -------------------------------------------------------------------------

  it('maps "is" to FilterOperator.equals', () => {
    const f = makeFilter({ operator: operatorStringBoolean.is, value: 'v' });
    const result = generate(filterBuilderAndOrOperator.AND, [f]);
    expect(
      (result?.clauses[0] as Extract<FilterBuilderClause, { property: string }>).operator,
    ).toBe(FilterOperator.equals);
  });

  it('maps "isNot" to FilterOperator.notEquals', () => {
    const f = makeFilter({ operator: operatorStringBoolean.isNot, value: 'v' });
    const result = generate(filterBuilderAndOrOperator.AND, [f]);
    expect(
      (result?.clauses[0] as Extract<FilterBuilderClause, { property: string }>).operator,
    ).toBe(FilterOperator.notEquals);
  });

  it('maps "isOneOf" to FilterOperator.contains', () => {
    const f = makeFilter({ operator: operatorStringBoolean.isOneOf, value: ['a', 'b'] });
    const result = generate(filterBuilderAndOrOperator.AND, [f]);
    expect(
      (result?.clauses[0] as Extract<FilterBuilderClause, { property: string }>).operator,
    ).toBe(FilterOperator.contains);
  });

  it('maps "isNotOneOf" to FilterOperator.notContains', () => {
    const f = makeFilter({ operator: operatorStringBoolean.isNotOneOf, value: ['a', 'b'] });
    const result = generate(filterBuilderAndOrOperator.AND, [f]);
    expect(
      (result?.clauses[0] as Extract<FilterBuilderClause, { property: string }>).operator,
    ).toBe(FilterOperator.notContains);
  });

  it('maps "contains" to FilterOperator.contains', () => {
    const f = makeFilter({ operator: operatorStringBoolean.contains, value: 'partial' });
    const result = generate(filterBuilderAndOrOperator.AND, [f]);
    expect(
      (result?.clauses[0] as Extract<FilterBuilderClause, { property: string }>).operator,
    ).toBe(FilterOperator.contains);
  });

  // -------------------------------------------------------------------------
  // number operators
  // -------------------------------------------------------------------------

  it('maps number equals operator', () => {
    const f = makeFilter({
      dimensionOrMeasure: makeDim(NativeDataType.number),
      operator: operatorNumber.equals,
      value: 42,
    });
    const result = generate(filterBuilderAndOrOperator.AND, [f]);
    const clause = result?.clauses[0] as Extract<FilterBuilderClause, { property: string }>;
    expect(clause.operator).toBe(FilterOperator.equals);
    expect(clause.value).toBe(42);
  });

  it('maps number notEquals operator', () => {
    const f = makeFilter({
      dimensionOrMeasure: makeDim(NativeDataType.number),
      operator: operatorNumber.notEquals,
      value: 10,
    });
    const result = generate(filterBuilderAndOrOperator.AND, [f]);
    expect(
      (result?.clauses[0] as Extract<FilterBuilderClause, { property: string }>).operator,
    ).toBe(FilterOperator.notEquals);
  });

  it('maps number gte operator', () => {
    const f = makeFilter({
      dimensionOrMeasure: makeDim(NativeDataType.number),
      operator: operatorNumber.gte,
      value: 5,
    });
    const result = generate(filterBuilderAndOrOperator.AND, [f]);
    expect(
      (result?.clauses[0] as Extract<FilterBuilderClause, { property: string }>).operator,
    ).toBe(FilterOperator.gte);
  });

  it('maps number lte operator', () => {
    const f = makeFilter({
      dimensionOrMeasure: makeDim(NativeDataType.number),
      operator: operatorNumber.lte,
      value: 100,
    });
    const result = generate(filterBuilderAndOrOperator.AND, [f]);
    expect(
      (result?.clauses[0] as Extract<FilterBuilderClause, { property: string }>).operator,
    ).toBe(FilterOperator.lte);
  });

  // -------------------------------------------------------------------------
  // "between" expands to AND clause
  // -------------------------------------------------------------------------

  it('expands "between" into an AND clause with gte and lte sub-clauses', () => {
    const f = makeFilter({
      dimensionOrMeasure: makeDim(NativeDataType.number, 'price'),
      operator: operatorNumber.between,
      value: [10, 50] as unknown as FilterBuilderFilter['value'],
    });
    const result = generate(filterBuilderAndOrOperator.AND, [f]);
    expect(result?.clauses).toHaveLength(1);

    const betweenClause = result?.clauses[0] as ClauseGroup;
    expect(betweenClause.operator).toBe(filterBuilderAndOrOperator.AND);
    expect(betweenClause.clauses).toHaveLength(2);
    expect(betweenClause.clauses[0]).toEqual({
      property: 'price',
      operator: FilterOperator.gte,
      value: 10,
    });
    expect(betweenClause.clauses[1]).toEqual({
      property: 'price',
      operator: FilterOperator.lte,
      value: 50,
    });
  });

  it('does NOT expand "between" for non-number types', () => {
    // "between" is only special-cased when nativeType === number
    const f = makeFilter({
      dimensionOrMeasure: makeDim(NativeDataType.string, 'name'),
      operator: operatorNumber.between,
      value: 'x',
    });
    const result = generate(filterBuilderAndOrOperator.AND, [f]);
    expect(result?.clauses[0]).not.toHaveProperty('clauses');
  });

  // -------------------------------------------------------------------------
  // multiple filters
  // -------------------------------------------------------------------------

  it('produces one clause per complete filter', () => {
    const f1 = makeFilter({ operator: operatorStringBoolean.is, value: 'a' });
    const f2 = makeFilter({
      id: 2,
      dimensionOrMeasure: makeDim(NativeDataType.number, 'age'),
      operator: operatorNumber.gte,
      value: 18,
    });
    const result = generate(filterBuilderAndOrOperator.OR, [f1, f2]);
    expect(result?.clauses).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// clauseToFilter
// ---------------------------------------------------------------------------

describe('clauseToFilter', () => {
  const dims = [
    makeDim(NativeDataType.string, 'name'),
    makeDim(NativeDataType.number, 'age'),
    makeDim(NativeDataType.boolean, 'active'),
  ];

  // -------------------------------------------------------------------------
  // leaf clauses — string / boolean operators
  // -------------------------------------------------------------------------

  it('maps FilterOperator.equals to "is" for a string dimension', () => {
    const clause: FilterBuilderClause = {
      property: 'name',
      operator: FilterOperator.equals,
      value: 'Alice',
    };
    const result = clauseToFilter(clause, dims, 1);
    expect(result).toEqual({
      id: 1,
      dimensionOrMeasure: dims[0],
      search: '',
      operator: operatorStringBoolean.is,
      value: 'Alice',
    });
  });

  it('maps FilterOperator.notEquals to "isNot" for a string dimension', () => {
    const clause: FilterBuilderClause = {
      property: 'name',
      operator: FilterOperator.notEquals,
      value: 'Bob',
    };
    const result = clauseToFilter(clause, dims, 2);
    expect(result?.operator).toBe(operatorStringBoolean.isNot);
  });

  it('maps FilterOperator.contains with an array value to "isOneOf"', () => {
    const clause: FilterBuilderClause = {
      property: 'name',
      operator: FilterOperator.contains,
      value: ['Alice', 'Bob'],
    };
    const result = clauseToFilter(clause, dims, 1);
    expect(result?.operator).toBe(operatorStringBoolean.isOneOf);
  });

  it('maps FilterOperator.contains with a scalar value to "contains"', () => {
    const clause: FilterBuilderClause = {
      property: 'name',
      operator: FilterOperator.contains,
      value: 'Ali',
    };
    const result = clauseToFilter(clause, dims, 1);
    expect(result?.operator).toBe(operatorStringBoolean.contains);
  });

  it('maps FilterOperator.notContains to "isNotOneOf"', () => {
    const clause: FilterBuilderClause = {
      property: 'name',
      operator: FilterOperator.notContains,
      value: ['x'],
    };
    const result = clauseToFilter(clause, dims, 1);
    expect(result?.operator).toBe(operatorStringBoolean.isNotOneOf);
  });

  // -------------------------------------------------------------------------
  // leaf clauses — number operators
  // -------------------------------------------------------------------------

  it('maps FilterOperator.equals to operatorNumber.equals for a number dimension', () => {
    const clause: FilterBuilderClause = {
      property: 'age',
      operator: FilterOperator.equals,
      value: 30,
    };
    const result = clauseToFilter(clause, dims, 1);
    expect(result?.operator).toBe(operatorNumber.equals);
  });

  it('maps FilterOperator.notEquals to operatorNumber.notEquals for a number dimension', () => {
    const clause: FilterBuilderClause = {
      property: 'age',
      operator: FilterOperator.notEquals,
      value: 0,
    };
    const result = clauseToFilter(clause, dims, 1);
    expect(result?.operator).toBe(operatorNumber.notEquals);
  });

  it('maps FilterOperator.gte to operatorNumber.gte', () => {
    const clause: FilterBuilderClause = {
      property: 'age',
      operator: FilterOperator.gte,
      value: 18,
    };
    const result = clauseToFilter(clause, dims, 1);
    expect(result?.operator).toBe(operatorNumber.gte);
  });

  it('maps FilterOperator.lte to operatorNumber.lte', () => {
    const clause: FilterBuilderClause = {
      property: 'age',
      operator: FilterOperator.lte,
      value: 65,
    };
    const result = clauseToFilter(clause, dims, 1);
    expect(result?.operator).toBe(operatorNumber.lte);
  });

  it('sets dimensionOrMeasure to null when property is not in dimensionsAndMeasures', () => {
    const clause: FilterBuilderClause = {
      property: 'unknown',
      operator: FilterOperator.equals,
      value: 'x',
    };
    const result = clauseToFilter(clause, dims, 1);
    expect(result?.dimensionOrMeasure).toBeNull();
  });

  it('sets operator to null for an unrecognised FilterOperator on a non-number dimension', () => {
    const clause: FilterBuilderClause = {
      property: 'name',
      operator: FilterOperator.gte,
      value: 'x',
    };
    const result = clauseToFilter(clause, dims, 1);
    expect(result?.operator).toBeNull();
  });

  it('preserves the id passed in', () => {
    const clause: FilterBuilderClause = {
      property: 'name',
      operator: FilterOperator.equals,
      value: 'v',
    };
    expect(clauseToFilter(clause, dims, 7)?.id).toBe(7);
  });

  // -------------------------------------------------------------------------
  // group clauses (between)
  // -------------------------------------------------------------------------

  it('converts an AND group with gte+lte on the same property to a "between" filter', () => {
    const clause: FilterBuilderClause = {
      operator: filterBuilderAndOrOperator.AND,
      clauses: [
        { property: 'age', operator: FilterOperator.gte, value: 18 },
        { property: 'age', operator: FilterOperator.lte, value: 65 },
      ],
    };
    const result = clauseToFilter(clause, dims, 3);
    expect(result).toEqual({
      id: 3,
      dimensionOrMeasure: dims[1],
      search: '',
      operator: operatorNumber.between,
      value: [18, 65],
    });
  });

  it('returns null for an OR group', () => {
    const clause: FilterBuilderClause = {
      operator: filterBuilderAndOrOperator.OR,
      clauses: [
        { property: 'age', operator: FilterOperator.gte, value: 18 },
        { property: 'age', operator: FilterOperator.lte, value: 65 },
      ],
    };
    expect(clauseToFilter(clause, dims, 1)).toBeNull();
  });

  it('returns null for an AND group with only one sub-clause', () => {
    const clause: FilterBuilderClause = {
      operator: filterBuilderAndOrOperator.AND,
      clauses: [{ property: 'age', operator: FilterOperator.gte, value: 18 }],
    };
    expect(clauseToFilter(clause, dims, 1)).toBeNull();
  });

  it('returns null for an AND group where sub-clauses have different properties', () => {
    const clause: FilterBuilderClause = {
      operator: filterBuilderAndOrOperator.AND,
      clauses: [
        { property: 'age', operator: FilterOperator.gte, value: 18 },
        { property: 'name', operator: FilterOperator.lte, value: 65 },
      ],
    };
    expect(clauseToFilter(clause, dims, 1)).toBeNull();
  });

  it('returns null for an AND group where operators are not gte+lte', () => {
    const clause: FilterBuilderClause = {
      operator: filterBuilderAndOrOperator.AND,
      clauses: [
        { property: 'age', operator: FilterOperator.equals, value: 18 },
        { property: 'age', operator: FilterOperator.equals, value: 65 },
      ],
    };
    expect(clauseToFilter(clause, dims, 1)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// clauseToFilters
// ---------------------------------------------------------------------------

describe('clauseToFilters', () => {
  const dims = [makeDim(NativeDataType.string, 'name'), makeDim(NativeDataType.number, 'age')];

  it('returns an empty array for null input', () => {
    expect(clauseToFilters(null, dims)).toEqual([]);
  });

  it('returns an empty array for a leaf clause (no sub-clauses)', () => {
    const leaf: FilterBuilderClause = {
      property: 'name',
      operator: FilterOperator.equals,
      value: 'x',
    };
    expect(clauseToFilters(leaf, dims)).toEqual([]);
  });

  it('maps each sub-clause to a FilterBuilderFilter', () => {
    const clause: FilterBuilderClause = {
      operator: filterBuilderAndOrOperator.AND,
      clauses: [
        { property: 'name', operator: FilterOperator.equals, value: 'Alice' },
        { property: 'age', operator: FilterOperator.gte, value: 18 },
      ],
    };
    const result = clauseToFilters(clause, dims);
    expect(result).toHaveLength(2);
    expect(result[0]!.operator).toBe(operatorStringBoolean.is);
    expect(result[1]!.operator).toBe(operatorNumber.gte);
  });

  it('assigns sequential ids starting from 1', () => {
    const clause: FilterBuilderClause = {
      operator: filterBuilderAndOrOperator.AND,
      clauses: [
        { property: 'name', operator: FilterOperator.equals, value: 'A' },
        { property: 'name', operator: FilterOperator.equals, value: 'B' },
      ],
    };
    const result = clauseToFilters(clause, dims);
    expect(result.map((f) => f.id)).toEqual([1, 2]);
  });

  it('drops sub-clauses that clauseToFilter cannot convert (returns null)', () => {
    // An OR group inside the top-level clause cannot be round-tripped back.
    const clause: FilterBuilderClause = {
      operator: filterBuilderAndOrOperator.AND,
      clauses: [
        { property: 'name', operator: FilterOperator.equals, value: 'Alice' },
        // OR group → clauseToFilter returns null
        {
          operator: filterBuilderAndOrOperator.OR,
          clauses: [{ property: 'age', operator: FilterOperator.gte, value: 5 }],
        },
      ],
    };
    const result = clauseToFilters(clause, dims);
    expect(result).toHaveLength(1);
    expect(result[0]!.value).toBe('Alice');
  });

  it('converts a between sub-clause back to a "between" filter', () => {
    const clause: FilterBuilderClause = {
      operator: filterBuilderAndOrOperator.AND,
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
    const result = clauseToFilters(clause, dims);
    expect(result).toHaveLength(1);
    expect(result[0]!.operator).toBe(operatorNumber.between);
    expect(result[0]!.value).toEqual([20, 40]);
  });

  it('returns an empty array when all sub-clauses produce null', () => {
    const clause: FilterBuilderClause = {
      operator: filterBuilderAndOrOperator.AND,
      clauses: [{ operator: filterBuilderAndOrOperator.OR, clauses: [] }],
    };
    expect(clauseToFilters(clause, dims)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getMultiSelectDisplayValue
// ---------------------------------------------------------------------------

describe('getMultiSelectDisplayValue', () => {
  const getLabel = (v: string) => `label-${v}`;

  it('localises the empty-selection state via i18n instead of a hardcoded string', () => {
    expect(getMultiSelectDisplayValue([], getLabel)).toBe('editors.filterBuilder.noSelection');
  });

  it('localises the count label via i18n instead of a hardcoded string', () => {
    expect(getMultiSelectDisplayValue(['a', 'b', 'c'], getLabel)).toBe(
      'editors.filterBuilder.countSelected:3',
    );
  });

  it('joins labels when 1 or 2 values are selected', () => {
    expect(getMultiSelectDisplayValue(['a'], getLabel)).toBe('label-a');
    expect(getMultiSelectDisplayValue(['a', 'b'], getLabel)).toBe('label-a, label-b');
  });
});
