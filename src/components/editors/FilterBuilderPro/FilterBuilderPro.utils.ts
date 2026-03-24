import { DimensionOrMeasure, FilterOperator, NativeDataType } from '@embeddable.com/core';
import { FilterBuilderFilter } from './definition';

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
  if (f.operator === 'between' && f.dimensionOrMeasure?.nativeType === NativeDataType.number) {
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
  return [{ property: f.dimensionOrMeasure!.name, operator: f.operator!, value: f.value }];
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
