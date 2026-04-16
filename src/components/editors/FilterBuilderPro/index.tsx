import { DataResponse, DimensionOrMeasure } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Theme } from '../../../theme/theme.types';
import FilterBuilderItem from './components/FilterBuilderItem';
import { FilterBuilderFilter, FilterBuilderState } from './definition';
import { ActionIcon, SingleSelectField } from '@embeddable.com/remarkable-ui';
import { IconPlus, IconChevronRight, IconChevronLeft } from '@tabler/icons-react';
import styles from './FilterBuilderPro.module.css';
import {
  filterBuilderAndOrOperator,
  filtersToClause,
  getSupportedDimensionsAndMeasures,
  clauseToFilters,
  FilterBuilderClause,
} from './FilterBuilderPro.utils';
import { i18n, i18nSetup } from '../../../theme/i18n/i18n';
import { getDimensionAndMeasureOptions } from '../utils/dimensionsAndMeasures.utils';
import { resolveI18nProps } from '../../component.utils';
import { EditorCard, EditorCardHeaderProps } from '../shared/EditorCard/EditorCard';
// import { useHorizontalScroll } from '../../horizontalScroll.hooks';

export type FilterBuilderProProps = {
  embeddableState?: FilterBuilderState;
  setEmbeddableState?: (
    state: FilterBuilderState | ((prev: FilterBuilderState) => FilterBuilderState),
  ) => void;
  dimensionsAndMeasures?: DimensionOrMeasure[];
  onChange?: (value: unknown) => void;
  defaultFilters?: FilterBuilderClause;
} & EditorCardHeaderProps;

const FilterBuilderPro = (props: FilterBuilderProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const { title, description, tooltip } = resolveI18nProps(props);
  const {
    dimensionsAndMeasures = [],
    setEmbeddableState,
    embeddableState,
    onChange,
    defaultFilters,
  } = props;

  const [searchNew, setSearchNew] = useState('');
  // const { scrollRef, canScrollLeft, canScrollRight, handleScrollLeft, handleScrollRight } =
  //   useHorizontalScroll([embeddableState?.filters]);

  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevFilterValueRef = useRef<unknown>(undefined);
  const disableAutoScroll = useRef(true);

  // Update embeddableState.filters from defaultFilters if any, but only when there
  // is no existing filter state (i.e. on initial mount / after a remount). This prevents
  // the variable feedback loop (inputs: ['defaultFilters']) from overwriting user edits
  // mid-session when the platform re-sends props with the previous clause value.
  useEffect(() => {
    if (!defaultFilters || !dimensionsAndMeasures?.length) {
      return;
    }

    const newFilters = clauseToFilters(defaultFilters, dimensionsAndMeasures);

    if (newFilters.length > 0) {
      setEmbeddableState?.((prev) => {
        if (prev?.filters?.length) {
          return prev;
        }

        return { ...prev, filters: newFilters };
      });
    }

    // Auto-scroll reactivated after initial load or when defaultFilters change
    setTimeout(() => {
      disableAutoScroll.current = false;
    }, 100);
  }, [defaultFilters, dimensionsAndMeasures]);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  const handleScrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  const handleScrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    el.addEventListener('scroll', updateScrollState);
    updateScrollState();
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', updateScrollState);
    };
  }, [updateScrollState, embeddableState?.filters]);

  const lastFilterId = embeddableState?.filters?.[embeddableState.filters.length - 1]?.id ?? 0;
  const lastFilter = embeddableState?.filters?.[embeddableState.filters.length - 1];
  const lastFilterKey = `${lastFilter?.id}-${lastFilter?.dimensionOrMeasure?.name}-${lastFilter?.operator}-${JSON.stringify(lastFilter?.value)}`;

  useEffect(() => {
    if (disableAutoScroll.current) {
      return;
    }
    setTimeout(() => {
      scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'smooth' });
    }, 100);
  }, [lastFilterKey]);

  const newFilter = (dimensionOrMeasureValue: string | null = null): FilterBuilderFilter => {
    const dimensionOrMeasure =
      dimensionsAndMeasures.find((d) => d.name === dimensionOrMeasureValue) ?? null;

    return { id: lastFilterId + 1, dimensionOrMeasure, search: '', operator: null, value: null };
  };

  const filters = embeddableState?.filters?.length ? embeddableState.filters : [newFilter()];

  const handleSelectDimensionOrMeasure = (index: number, name: string | null) => {
    setEmbeddableState?.((prev: FilterBuilderState) => {
      const newFilters = [...(prev?.filters ?? [])];

      const existing = newFilters[index];

      newFilters[index] = {
        ...newFilter(name),
        ...(existing?.id ? { id: existing.id } : {}),
      };

      return { ...prev, filters: newFilters };
    });
  };

  const handleSelectOperator = (index: number, operator: string | null) => {
    setEmbeddableState?.((prev: FilterBuilderState) => {
      const newFilters = [...(prev?.filters ?? [])];
      newFilters[index] = { ...newFilters[index]!, operator, value: null };
      return { ...prev, filters: newFilters };
    });
  };

  const handleSelectValue = (index: number, value: FilterBuilderFilter['value']) => {
    setEmbeddableState?.((prev: FilterBuilderState) => {
      const newFilters = [...(prev?.filters ?? [])];
      newFilters[index] = { ...newFilters[index]!, value };
      return { ...prev, filters: newFilters };
    });
  };

  const handleDimensionSearch = (index: number, search: string) => {
    setEmbeddableState?.((prev: FilterBuilderState) => {
      const newFilters = [...(prev?.filters ?? [])];
      newFilters[index] = { ...newFilters[index]!, search };
      return { ...prev, filters: newFilters };
    });
  };

  const handleDeleteFilter = (index: number) => {
    setEmbeddableState?.((prev: FilterBuilderState) => {
      const newFilters = [...(prev?.filters ?? [])];
      newFilters.splice(index, 1);
      return { ...prev, filters: newFilters };
    });
  };

  const handleAddFilter = (value: string | null) => {
    setEmbeddableState?.((prev: FilterBuilderState) => {
      const newFilters = [...(prev?.filters ?? []), newFilter(value)];
      return { ...prev, filters: newFilters };
    });
    setTimeout(() => {
      scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'smooth' });
    }, 0);
  };

  useEffect(() => {
    const filterValue = filtersToClause(filterBuilderAndOrOperator.AND, filters);
    const serialized = JSON.stringify(filterValue);
    if (serialized === JSON.stringify(prevFilterValueRef.current)) return;
    prevFilterValueRef.current = filterValue;
    onChange?.(filterValue);
  }, [filters]);

  const supportedDimensionsAndMeasures = getSupportedDimensionsAndMeasures(dimensionsAndMeasures);

  const dimensionOptionsNew = getDimensionAndMeasureOptions({
    dimensionsAndMeasures: supportedDimensionsAndMeasures,
    searchValue: searchNew,
    theme,
  });

  const hasClearAll = filters.some((f) => f.dimensionOrMeasure && f.operator && f.value != null);

  const handleClearAll = () => {
    setEmbeddableState?.((prev: FilterBuilderState) => ({ ...prev, filters: [newFilter()] }));
  };

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <div className={styles.container}>
        {canScrollLeft && (
          <button className={styles.scrollLeftButton} onClick={handleScrollLeft}>
            <IconChevronLeft />
          </button>
        )}
        <div className={styles.scroll} ref={scrollRef}>
          {filters.map((filter, index) => (
            <React.Fragment key={filter.id}>
              <FilterBuilderItem
                filter={filter}
                dimensionsAndMeasures={dimensionsAndMeasures}
                results={
                  (props as Record<string, unknown>)[`filterResults${filter.id}`] as
                    | DataResponse
                    | undefined
                }
                theme={theme}
                onSelectDimensionOrMeasure={(value) => handleSelectDimensionOrMeasure(index, value)}
                onSelectOperator={(value) => handleSelectOperator(index, value)}
                onSelectValue={(value) => handleSelectValue(index, value)}
                onSearchValue={(search) => handleDimensionSearch(index, search)}
                onDelete={() => handleDeleteFilter(index)}
              />
            </React.Fragment>
          ))}
        </div>
        {canScrollRight && (
          <button className={styles.scrollRightButton} onClick={handleScrollRight}>
            <IconChevronRight />
          </button>
        )}

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
        {hasClearAll && (
          <button className={styles.clearButton} onClick={handleClearAll}>
            {i18n.t('editors.filterBuilder.clearAll')}
          </button>
        )}
      </div>
    </EditorCard>
  );
};

export default FilterBuilderPro;
