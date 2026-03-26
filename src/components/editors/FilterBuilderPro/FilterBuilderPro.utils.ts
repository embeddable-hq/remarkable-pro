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

export const filterBuilderOperator = {
  AND: 'and',
  OR: 'or',
};
export type FilterBuilderOperator =
  (typeof filterBuilderOperator)[keyof typeof filterBuilderOperator];

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
      operator: FilterBuilderOperator;
      value: FilterBuilderFilter['value'];
    }
  | { operator: FilterBuilderOperator; clauses: FilterBuilderClause[] };

const filterToClause = (f: FilterBuilderFilter): FilterBuilderClause[] => {
  if (
    f.operator === operatorNumber.between &&
    f.dimensionOrMeasure?.nativeType === NativeDataType.number
  ) {
    const [min, max] = f.value as [number, number];
    return [
      {
        operator: filterBuilderOperator.AND,
        clauses: [
          { property: f.dimensionOrMeasure.name, operator: FilterOperator.gte, value: min },
          { property: f.dimensionOrMeasure.name, operator: FilterOperator.lte, value: max },
        ],
      },
    ];
  }
  const mappedOperator =
    operatorStringBooleanMappedFilterOperator[f.operator!] ??
    operatorNumberMappedFilterOperator[f.operator!] ??
    f.operator!;
  return [{ property: f.dimensionOrMeasure!.name, operator: mappedOperator, value: f.value }];
};

export const generateFilterValue = (
  operator: FilterBuilderOperator,
  filters: FilterBuilderFilter[],
): FilterBuilderClause | null => {
  const clauses = filters
    .filter((f) => f.dimensionOrMeasure && f.operator && f.value != null)
    .flatMap(filterToClause);

  if (clauses.length === 0) return null;

  return { operator, clauses };
};
