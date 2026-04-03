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
  filterBuilderAndOrOperator,
  generateFilterValue,
  getSupportedDimensionsAndMeasures,
} from './FilterBuilderPro.utils';
import { i18n, i18nSetup } from '../../../theme/i18n/i18n';
import { getDimensionAndMeasureOptions } from '../utils/dimensionsAndMeasures.utils';
import { resolveI18nProps } from '../../component.utils';
import { EditorCard, EditorCardHeaderProps } from '../shared/EditorCard/EditorCard';
import { useHorizontalScroll } from '../../horizontalScroll.hooks';

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

  const [searchNew, setSearchNew] = useState('');
  const { scrollRef, canScrollLeft, canScrollRight, handleScrollLeft, handleScrollRight } =
    useHorizontalScroll([embeddableState?.filters]);

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
    const filterValue = generateFilterValue(filterBuilderAndOrOperator.AND, filters);
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
