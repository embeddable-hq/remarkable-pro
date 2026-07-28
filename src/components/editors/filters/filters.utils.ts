import {
  DimensionOrMeasure,
  FilterOperator,
  isDimension,
  isMeasure,
  NativeDataType,
} from '@embeddable.com/core';
import { i18n } from '../../../theme/i18n/i18n';

export type FilterBuilderFilter = {
  id: number;
  dimensionOrMeasure: DimensionOrMeasure | null;
  search: string;
  value: string | string[] | number | number[] | boolean | null;
  operator: string | null;
};

/**
 * Cube cannot combine a dimension filter (row-level WHERE) with a measure
 * filter (aggregate HAVING) in the same logical operator. Used to decide when
 * an OR must be forced back to AND.
 */
export const hasMixedDimensionsAndMeasures = (filters: FilterBuilderFilter[]): boolean =>
  filters.some((f) => isDimension(f.dimensionOrMeasure ?? undefined)) &&
  filters.some((f) => isMeasure(f.dimensionOrMeasure ?? undefined));

/** Identity key for the last filter in a list — changes whenever its member,
 * operator, or value changes, used to trigger scrolling to a newly added or
 * edited filter. */
export const getLastFilterKey = (filters: FilterBuilderFilter[]): string => {
  const last = filters[filters.length - 1];
  return `${last?.id}-${last?.dimensionOrMeasure?.name}-${last?.operator}-${JSON.stringify(last?.value)}`;
};

/** A fresh, unconfigured filter for the given id — optionally pre-selecting a
 * member by name (looked up from the available dimensions/measures). */
export const createEmptyFilter = (
  id: number,
  dimensionsAndMeasures: DimensionOrMeasure[],
  name: string | null = null,
): FilterBuilderFilter => ({
  id,
  dimensionOrMeasure: dimensionsAndMeasures.find((d) => d.name === name) ?? null,
  search: '',
  operator: null,
  value: null,
});

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

export const FILTER_BUILDER_SUPPORTED_TYPES: string[] = [
  NativeDataType.string,
  NativeDataType.boolean,
  NativeDataType.number,
];

export const getSupportedDimensionsAndMeasures = (dimensionsAndMeasures: DimensionOrMeasure[]) => {
  return dimensionsAndMeasures.filter((d) => FILTER_BUILDER_SUPPORTED_TYPES.includes(d.nativeType));
};

export const getStringOperatorOptions = () => [
  { value: operatorStringBoolean.is, label: i18n.t('editors.filterBuilder.is') },
  { value: operatorStringBoolean.isNot, label: i18n.t('editors.filterBuilder.isNot') },
  { value: operatorStringBoolean.isOneOf, label: i18n.t('editors.filterBuilder.isOneOf') },
  { value: operatorStringBoolean.isNotOneOf, label: i18n.t('editors.filterBuilder.isNotOneOf') },
  { value: operatorStringBoolean.contains, label: i18n.t('editors.filterBuilder.contains') },
];

export const getBooleanOperatorOptions = () => [
  { value: operatorStringBoolean.is, label: i18n.t('editors.filterBuilder.is') },
  { value: operatorStringBoolean.isNot, label: i18n.t('editors.filterBuilder.isNot') },
  { value: operatorStringBoolean.isOneOf, label: i18n.t('editors.filterBuilder.isOneOf') },
  { value: operatorStringBoolean.isNotOneOf, label: i18n.t('editors.filterBuilder.isNotOneOf') },
];

export const getNumberOperatorOptions = () => [
  { value: operatorNumber.equals, label: i18n.t('editors.filterBuilder.equals') },
  { value: operatorNumber.notEquals, label: i18n.t('editors.filterBuilder.doesNotEqual') },
  { value: operatorNumber.gte, label: i18n.t('editors.filterBuilder.greaterThanOrEqualTo') },
  { value: operatorNumber.lte, label: i18n.t('editors.filterBuilder.lessThanOrEqualTo') },
  { value: operatorNumber.between, label: i18n.t('editors.filterBuilder.between') },
];

export const getOperatorOptions = (dimensionOrMeasure: DimensionOrMeasure) => {
  if (dimensionOrMeasure.nativeType === NativeDataType.number) return getNumberOperatorOptions();
  if (dimensionOrMeasure.nativeType === NativeDataType.boolean) return getBooleanOperatorOptions();
  return getStringOperatorOptions();
};

export const normalizeSelectedValues = (value: unknown): string[] => {
  if (Array.isArray(value)) return value as string[];
  if (value === null || value === undefined) return [];
  return [value as string];
};

export const sortOptionsWithSelectedFirst = <T extends { value: string }>(
  rawOptions: T[],
  selectedValues: string[],
): T[] => [
  ...rawOptions.filter((o) => selectedValues.includes(o.value)),
  ...rawOptions.filter((o) => !selectedValues.includes(o.value)),
];

export const getMultiSelectDisplayValue = (
  filterValue: string[],
  getLabel: (value: string) => string,
): string => {
  if (filterValue.length === 0) return i18n.t('editors.filterBuilder.noSelection');
  if (filterValue.length > 2) {
    return i18n.t('editors.filterBuilder.countSelected', { count: filterValue.length });
  }
  return filterValue.map(getLabel).join(', ');
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

export const filterToClause = (f: FilterBuilderFilter): FilterBuilderClause[] => {
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
