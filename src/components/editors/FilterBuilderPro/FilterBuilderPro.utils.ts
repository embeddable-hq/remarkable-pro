import { FilterOperator, NativeDataType } from '@embeddable.com/core';
import { FilterBuilderFilter } from './definition';

export const FILTER_BUILDER_PRO_SUPPORTED_TYPES: string[] = [
  NativeDataType.string,
  NativeDataType.boolean,
  NativeDataType.number,
];

export const getSupportedDimensionsAndMeasures = (dimensionsAndMeasures: any[]) => {
  return dimensionsAndMeasures.filter((d) =>
    FILTER_BUILDER_PRO_SUPPORTED_TYPES.includes(d.nativeType),
  );
};

export type Clause = {
  property: string;
  operator: string;
  value: FilterBuilderFilter['value'];
};

const filterToClause = (f: FilterBuilderFilter): Clause[] => {
  if (f.operator === 'between' && f.dimensionOrMeasure?.nativeType === NativeDataType.number) {
    const [min, max] = f.value as [number, number];
    return [
      { property: f.dimensionOrMeasure.name, operator: FilterOperator.gte, value: min },
      { property: f.dimensionOrMeasure.name, operator: FilterOperator.lte, value: max },
    ];
  }
  return [{ property: f.dimensionOrMeasure!.name, operator: f.operator!, value: f.value }];
};

export const generateFilterValue = (filters: FilterBuilderFilter[]) => {
  const clauses = filters
    .filter((f) => f.dimensionOrMeasure && f.operator && f.value != null)
    .flatMap(filterToClause);

  if (clauses.length === 0) return null;

  return { operator: 'and', clauses };
};
