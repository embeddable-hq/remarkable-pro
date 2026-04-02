import { FilterOperator, NativeDataType } from '@embeddable.com/core';
import type { DimensionOrMeasure } from '@embeddable.com/core';
import {
  filterBuilderAndOrOperator,
  generateFilterValue,
  getSupportedDimensionsAndMeasures,
  operatorNumber,
  operatorStringBoolean,
} from './FilterBuilderPro.utils';
import type { FilterBuilderClause } from './FilterBuilderPro.utils';
import type { FilterBuilderFilter } from './definition';

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

const generate = (...args: Parameters<typeof generateFilterValue>): ClauseGroup | null =>
  generateFilterValue(...args) as ClauseGroup | null;

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
// generateFilterValue
// ---------------------------------------------------------------------------

describe('generateFilterValue', () => {
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
