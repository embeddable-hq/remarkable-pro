import { DataResponse, DimensionOrMeasure } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import React, { useEffect, useRef, useState } from 'react';
import { Theme } from '../../../theme/theme.types';
import FilterBuilderItem from './components/FilterBuilderItem';
import { FilterBuilderFilter, FilterBuilderState } from './definition';
import { ActionIcon, SingleSelectField } from '@embeddable.com/remarkable-ui';
import { IconPlus, IconChevronRight, IconChevronLeft } from '@tabler/icons-react';
import styles from './FilterBuilderPro.module.css';
import {
  FilterBuilderOperator,
  filterBuilderOperator,
  generateFilterValue,
  getSupportedDimensionsAndMeasures,
} from './FilterBuilderPro.utils';
import { i18n, i18nSetup } from '../../../theme/i18n/i18n';
import { getDimensionAndMeasureOptions } from '../utils/dimensionsAndMeasures.utils';
import { FilterBuilderProAndOrButton } from './components/FilterBuilderProAndOrButton';
import { resolveI18nProps } from '../../component.utils';
import { EditorCard, EditorCardHeaderProps } from '../shared/EditorCard/EditorCard';

export type FilterBuilderProProps = {
  embeddableState?: FilterBuilderState;
  setEmbeddableState?: (
    state: FilterBuilderState | ((prev: FilterBuilderState) => FilterBuilderState),
  ) => void;
  dimensionsAndMeasures?: DimensionOrMeasure[];
  onChange?: (value: unknown) => void;
} & EditorCardHeaderProps;

const FilterBuilderPro = (props: FilterBuilderProProps) => {
  const theme = useTheme() as Theme;
  i18nSetup(theme);

  const { title, description, tooltip } = resolveI18nProps(props);
  const { dimensionsAndMeasures = [], setEmbeddableState, embeddableState, onChange } = props;

  const [andOrOperator, setAndOrOperator] = useState<FilterBuilderOperator>(
    filterBuilderOperator.AND,
  );
  const [searchNew, setSearchNew] = useState('');
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    setCanScrollLeft(el.scrollLeft > 0);
  };

  const handleScrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  const handleScrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const prevFilterValueRef = useRef<unknown>(undefined);

  const lastFilterId = embeddableState?.filters?.[embeddableState.filters.length - 1]?.id ?? 0;

  const lastFilter = embeddableState?.filters?.[embeddableState.filters.length - 1];
  const lastFilterKey = `${lastFilter?.id}-${lastFilter?.dimensionOrMeasure?.name}-${lastFilter?.operator}-${JSON.stringify(lastFilter?.value)}`;

  useEffect(() => {
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
    const filterValue = generateFilterValue(andOrOperator, filters);
    const serialized = JSON.stringify(filterValue);
    if (serialized === JSON.stringify(prevFilterValueRef.current)) return;
    prevFilterValueRef.current = filterValue;
    onChange?.(filterValue);
  }, [filters, andOrOperator]);

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
              {index < filters.length - 1 && (
                <FilterBuilderProAndOrButton
                  operator={andOrOperator}
                  onChange={(value) => setAndOrOperator(value)}
                />
              )}
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
