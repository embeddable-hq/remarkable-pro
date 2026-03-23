import { DataResponse, DimensionOrMeasure } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import { useEffect, useRef, useState } from 'react';
import { Theme } from '../../../theme/theme.types';
import FilterBuilderItem from './FilterBuilderItem';
import { FilterBuilderFilter, FilterBuilderState } from './definition';
import { ActionIcon, SingleSelectField } from '@embeddable.com/remarkable-ui';
import { IconPlus, IconChevronRight } from '@tabler/icons-react';
import styles from './FilterBuilderPro.module.css';
import clsx from 'clsx';
import { generateFilterValue, getSupportedDimensionsAndMeasures } from './FilterBuilderPro.utils';
import { i18n, i18nSetup } from '../../../theme/i18n/i18n';
import { getDimensionAndMeasureOptions } from '../utils/dimensionsAndMeasures.utils';

// DISCUSS WITH DENIS
// - review all the css variables
// - input sizes

// add spinner when fetching data for select and multi select
// when it is an input value, auto focus the 1st input
// fire filter change on select option or debounce value
// inputs should start growing with the text

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
  i18nSetup(theme);

  const [searchNew, setSearchNew] = useState('');
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const handleScrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

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
  const newFilter = (dimensionOrMeasureValue: string | null = null): FilterBuilderFilter => {
    const dimensionOrMeasure =
      dimensionsAndMeasures.find((d) => d.name === dimensionOrMeasureValue) ?? null;

    return { id: nextIdRef.current++, dimensionOrMeasure, search: '', value: null };
  };

  const filters = embeddableState?.filters?.length ? embeddableState.filters : [newFilter()];

  const handleSelectDimensionOrMeasure = (index: number, name: string | null) => {
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

  const handleSelectOperator = (index: number, operator: string | null) => {
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

  const handleDeleteFilter = (index: number) => {
    setEmbeddableState?.((prev: any) => {
      const newFilters = [...(prev?.filters ?? [])];
      newFilters.splice(index, 1);
      return { ...prev, filters: newFilters };
    });
  };

  const handleAddFilter = (value: string | null) => {
    setEmbeddableState?.((prev: any) => {
      const newFilters = [...(prev?.filters ?? []), newFilter(value)];
      return { ...prev, filters: newFilters };
    });
  };

  useEffect(() => {
    const filterValue = generateFilterValue(filters);
    const serialized = JSON.stringify(filterValue);
    if (serialized === JSON.stringify(prevFilterValueRef.current)) return;
    prevFilterValueRef.current = filterValue;
    onApply?.(filterValue);
  }, [filters]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, []);

  const supportedDimensionsAndMeasures = getSupportedDimensionsAndMeasures(dimensionsAndMeasures);

  const dimensionOptionsNew = getDimensionAndMeasureOptions({
    dimensionsAndMeasures: supportedDimensionsAndMeasures,
    searchValue: searchNew,
    theme,
  });

  const hasClearAll = filters.some((f) => f.dimensionOrMeasure && f.operator && f.value);

  const handleClearAll = () => {
    setEmbeddableState?.((prev: any) => ({ ...prev, filters: [newFilter()] }));
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterScrollArea} ref={scrollRef}>
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
            onDelete={() => handleDeleteFilter(index)}
          />
        ))}
        {filters[0]?.dimensionOrMeasure && (
          <SingleSelectField
            triggerComponent={<ActionIcon icon={IconPlus} />}
            searchable
            onChange={(value) => handleAddFilter(value)}
            onSearch={setSearchNew}
            options={dimensionOptionsNew}
            avoidCollisions={false}
            noOptionsMessage={i18n.t('common.noOptionsFound')}
          />
        )}
      </div>
      <div className={styles.filterFixedRight}>
        {canScrollRight && (
          <button
            className={clsx(styles.filterButton, styles.filterButtonScrollRight)}
            onClick={handleScrollRight}
          >
            <IconChevronRight />
          </button>
        )}
        {hasClearAll && (
          <button
            className={clsx(styles.filterButton, styles.filterButtonClearAll)}
            onClick={handleClearAll}
          >
            {i18n.t('filterBuilderPro.clearAll')}
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBuilderPro;
