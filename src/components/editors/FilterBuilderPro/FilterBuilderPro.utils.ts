import { DimensionOrMeasure, FilterOperator, NativeDataType } from '@embeddable.com/core';
import { FilterBuilderFilter } from './definition';

export const operatorStringBoolean = {
  is: 'is',
  isNot: 'isNot',
  isOneOf: 'isOneOf',
  isNotOneOf: 'isNotOneOf',
  contains: 'contains',
};

export const operatorStringBooleanMappedFilterOperator = {
  [operatorStringBoolean.is]: FilterOperator.equals,
  [operatorStringBoolean.isNot]: FilterOperator.notEquals,
  [operatorStringBoolean.isOneOf]: FilterOperator.contains,
  [operatorStringBoolean.isNotOneOf]: FilterOperator.notContains,
  [operatorStringBoolean.contains]: FilterOperator.contains,
};

export const operatorNumber = {
  equals: FilterOperator.equals,
  notEquals: FilterOperator.notEquals,
  gte: FilterOperator.gte,
  lte: FilterOperator.lte,
  between: 'between',
};

export const operatorNumberMappedFilterOperator: Record<string, FilterOperator> = {
  [operatorNumber.equals]: FilterOperator.equals,
  [operatorNumber.notEquals]: FilterOperator.notEquals,
  [operatorNumber.gte]: FilterOperator.gte,
  [operatorNumber.lte]: FilterOperator.lte,
};

export const filterBuilderAndOrOperator = {
  AND: 'and',
  OR: 'or',
};
export type FilterBuilderAndOrOperator =
  (typeof filterBuilderAndOrOperator)[keyof typeof filterBuilderAndOrOperator];

export const FILTER_BUILDER_PRO_SUPPORTED_TYPES: string[] = [
  NativeDataType.string,
  NativeDataType.boolean,
  NativeDataType.number,
];

export const getSupportedDimensionsAndMeasures = (dimensionsAndMeasures: DimensionOrMeasure[]) => {
  return dimensionsAndMeasures.filter((d) =>
    FILTER_BUILDER_PRO_SUPPORTED_TYPES.includes(d.nativeType),
  );
};

export type FilterBuilderClause =
  | {
      property: string;
      operator: FilterOperator;
      value: FilterBuilderFilter['value'];
    }
  | { operator: FilterBuilderAndOrOperator; clauses: FilterBuilderClause[] };

export type LoadDataFilter = {
  operator: FilterOperator;
  property: DimensionOrMeasure;
  value: NonNullable<FilterBuilderFilter['value']>;
};

export const filterToLoadDataFilters = (filter: FilterBuilderFilter): LoadDataFilter[] => {
  const { dimensionOrMeasure, operator, value } = filter;
  if (!dimensionOrMeasure || !operator || value == null) return [];

  if (
    operator === operatorNumber.between &&
    dimensionOrMeasure.nativeType === NativeDataType.number &&
    Array.isArray(value)
  ) {
    const numValue = value as [number, number];
    return [
      { operator: FilterOperator.gte, property: dimensionOrMeasure, value: numValue[0] },
      { operator: FilterOperator.lte, property: dimensionOrMeasure, value: numValue[1] },
    ];
  }

  const map =
    dimensionOrMeasure.nativeType === NativeDataType.number
      ? operatorNumberMappedFilterOperator
      : operatorStringBooleanMappedFilterOperator;
  const mappedOperator = map[operator];
  if (!mappedOperator) return [];

  return [{ operator: mappedOperator, property: dimensionOrMeasure, value }];
};

const filterToClause = (f: FilterBuilderFilter): FilterBuilderClause[] => {
  if (
    f.operator === operatorNumber.between &&
    f.dimensionOrMeasure?.nativeType === NativeDataType.number
  ) {
    const [min, max] = f.value as [number, number];
    return [
      {
        operator: filterBuilderAndOrOperator.AND,
        clauses: [
          { property: f.dimensionOrMeasure.name, operator: FilterOperator.gte, value: min },
          { property: f.dimensionOrMeasure.name, operator: FilterOperator.lte, value: max },
        ],
      },
    ];
  }
  const mappedOperator: FilterOperator =
    operatorStringBooleanMappedFilterOperator[f.operator!] ??
    operatorNumberMappedFilterOperator[f.operator!]!;

  return [{ property: f.dimensionOrMeasure!.name, operator: mappedOperator, value: f.value }];
};

export const filtersToClause = (
  operator: FilterBuilderAndOrOperator,
  filters: FilterBuilderFilter[],
): FilterBuilderClause | null => {
  const clauses = filters
    .filter((f) => f.dimensionOrMeasure && f.operator && f.value != null)
    .flatMap(filterToClause);

  if (clauses.length === 0) return null;

  return { operator, clauses };
};

export const clauseToFilter = (
  clause: FilterBuilderClause,
  dimensionsAndMeasures: DimensionOrMeasure[],
  id: number,
): FilterBuilderFilter | null => {
  if ('clauses' in clause) {
    const first = clause.clauses[0];
    const second = clause.clauses[1];
    if (
      clause.operator === filterBuilderAndOrOperator.AND &&
      clause.clauses.length === 2 &&
      first != null &&
      second != null &&
      'property' in first &&
      'property' in second &&
      first.property === second.property &&
      first.operator === FilterOperator.gte &&
      second.operator === FilterOperator.lte
    ) {
      const dimensionOrMeasure =
        dimensionsAndMeasures.find((d) => d.name === first.property) ?? null;
      return {
        id,
        dimensionOrMeasure,
        search: '',
        operator: operatorNumber.between,
        value: [first.value as number, second.value as number],
      };
    }
    return null;
  }

  const { property, operator, value } = clause;
  const dimensionOrMeasure = dimensionsAndMeasures.find((d) => d.name === property) ?? null;

  let uiOperator: string | null = null;

  if (dimensionOrMeasure?.nativeType === NativeDataType.number) {
    const reverseMap: Record<string, string> = {
      [FilterOperator.equals]: operatorNumber.equals,
      [FilterOperator.notEquals]: operatorNumber.notEquals,
      [FilterOperator.gte]: operatorNumber.gte,
      [FilterOperator.lte]: operatorNumber.lte,
    };
    uiOperator = reverseMap[operator] ?? null;
  } else if (operator === FilterOperator.contains) {
    uiOperator = Array.isArray(value)
      ? operatorStringBoolean.isOneOf
      : operatorStringBoolean.contains;
  } else {
    const reverseMap: Record<string, string> = {
      [FilterOperator.equals]: operatorStringBoolean.is,
      [FilterOperator.notEquals]: operatorStringBoolean.isNot,
      [FilterOperator.notContains]: operatorStringBoolean.isNotOneOf,
    };
    uiOperator = reverseMap[operator] ?? null;
  }

  return { id, dimensionOrMeasure, search: '', operator: uiOperator, value };
};

export const clauseToFilters = (
  clause: FilterBuilderClause | null,
  dimensionsAndMeasures: DimensionOrMeasure[],
): FilterBuilderFilter[] => {
  if (!clause) return [];

  if (!('clauses' in clause)) return [];

  const filters: FilterBuilderFilter[] = [];

  clause.clauses.forEach((subClause, i) => {
    const filter = clauseToFilter(subClause, dimensionsAndMeasures, i + 1);
    if (filter) filters.push(filter);
  });

  return filters.length ? filters : [];
};
