import {
  DataResponse,
  DimensionOrMeasure,
  FilterOperator,
  NativeDataType,
} from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import { useEffect, useRef } from 'react';
import { Theme } from '../../../theme/theme.types';
import FilterBuilderItem from './FilterBuilderItem';
import { FilterBuilderFilter, FilterBuilderState } from './definition';

export type FilterBuilderProProps = {
  embeddableState?: FilterBuilderState;
  setEmbeddableState?: (
    state: FilterBuilderState | ((prev: FilterBuilderState) => FilterBuilderState),
  ) => void;
  dimensionsAndMeasures?: DimensionOrMeasure[];
  results?: DataResponse[];
  onApply?: (value: unknown) => void;
};

const FilterBuilderPro = (props: FilterBuilderProProps) => {
  const theme = useTheme() as Theme;

  const {
    dimensionsAndMeasures = [],
    results = [],
    setEmbeddableState,
    embeddableState,
    onApply,
  } = props;

  const prevFilterValueRef = useRef<unknown>(undefined);
  const nextIdRef = useRef(
    (embeddableState?.filters?.reduce((max, f) => Math.max(max, f.id ?? 0), 0) ?? 0) + 1,
  );
  const newFilter = (): FilterBuilderFilter => ({
    id: nextIdRef.current++,
    dimensionOrMeasure: null,
    search: '',
    value: null,
  });

  const filters = embeddableState?.filters?.length ? embeddableState.filters : [newFilter()];

  const handleSelectDimensionOrMeasure = (index: number, name: string) => {
    const selected = dimensionsAndMeasures.find((d) => d.name === name) ?? null;
    setEmbeddableState?.((prev: any) => {
      const newFilters = [...(prev?.filters ?? [])];
      newFilters[index] = {
        ...newFilters[index],
        dimensionOrMeasure: selected,
        value: null,
        search: '',
        operator: undefined,
      };
      return { ...prev, filters: newFilters };
    });
  };

  const handleSelectOperator = (index: number, operator: string) => {
    setEmbeddableState?.((prev: any) => {
      const newFilters = [...(prev?.filters ?? [])];
      newFilters[index] = { ...newFilters[index], operator, value: null };
      return { ...prev, filters: newFilters };
    });
  };

  const handleSelectValue = (index: number, value: FilterBuilderFilter['value']) => {
    setEmbeddableState?.((prev: any) => {
      const newFilters = [...(prev?.filters ?? [])];
      newFilters[index] = { ...newFilters[index], value };
      return { ...prev, filters: newFilters };
    });
  };

  const handleDimensionSearch = (index: number, search: string) => {
    setEmbeddableState?.((prev: any) => {
      const newFilters = [...(prev?.filters ?? [])];
      newFilters[index] = { ...newFilters[index], search };
      return { ...prev, filters: newFilters };
    });
  };

  const handleAddFilter = () => {
    setEmbeddableState?.((prev: any) => ({
      ...prev,
      filters: [...(prev?.filters ?? []), newFilter()],
    }));
  };

  useEffect(() => {
    const filterValue = generateFilterValue(filters);
    const serialized = JSON.stringify(filterValue);
    if (serialized === JSON.stringify(prevFilterValueRef.current)) return;
    prevFilterValueRef.current = filterValue;
    onApply?.(filterValue);
  }, [filters]);

  return (
    <>
      {filters.map((filter, index) => (
        <FilterBuilderItem
          key={filter.id}
          filter={filter}
          dimensionsAndMeasures={dimensionsAndMeasures}
          results={results[index]}
          theme={theme}
          onSelectDimensionOrMeasure={(value) => handleSelectDimensionOrMeasure(index, value)}
          onSelectOperator={(value) => handleSelectOperator(index, value)}
          onSelectValue={(value) => handleSelectValue(index, value)}
          onSearchValue={(search) => handleDimensionSearch(index, search)}
        />
      ))}
      <button onClick={handleAddFilter}>button</button>
    </>
  );
};

export default FilterBuilderPro;

type Clause = {
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

const generateFilterValue = (filters: FilterBuilderFilter[]) => {
  const clauses = filters
    .filter((f) => f.dimensionOrMeasure && f.operator && f.value != null)
    .flatMap(filterToClause);

  if (clauses.length === 0) return null;

  return { operator: 'and', clauses };
};
