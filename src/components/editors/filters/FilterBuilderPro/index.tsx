import { DataResponse, DimensionOrMeasure } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Theme } from '../../../../theme/theme.types';
import FilterBuilderItem from './components/FilterBuilderItem';
import { FilterBuilderState } from './definition';
import { ActionIcon, SingleSelectField } from '@embeddable.com/remarkable-ui';
import { IconPlus, IconChevronRight, IconChevronLeft } from '@tabler/icons-react';
import styles from './FilterBuilderPro.module.css';
import {
  filterBuilderAndOrOperator,
  FilterBuilderAndOrOperator,
  FilterBuilderFilter,
  filtersToClause,
  createEmptyFilter,
  getLastFilterKey,
  getSupportedDimensionsAndMeasures,
  hasMixedDimensionsAndMeasures,
  clauseToFilters,
  FilterBuilderClause,
} from '../filters.utils';
import { FilterBuilderProAndOrButton } from './components/FilterBuilderProAndOrButton';
import { i18n, i18nSetup } from '../../../../theme/i18n/i18n';
import { getDimensionAndMeasureOptions } from '../../utils/dimensionsAndMeasures.utils';
import { resolveI18nProps } from '../../../component.utils';
import { EditorCard, EditorCardHeaderProps } from '../../shared/EditorCard/EditorCard';
import {
  FilterBuilderClauseGroup,
  useAdoptDefaultFilters,
  useFilterBuilderScroll,
} from '../filters.hooks';

export type FilterBuilderProProps = {
  embeddableState?: FilterBuilderState;
  setEmbeddableState?: (
    state: FilterBuilderState | ((prev: FilterBuilderState) => FilterBuilderState),
  ) => void;
  dimensionsAndMeasures?: DimensionOrMeasure[];
  onChange?: (value: unknown) => void;
  defaultFilters?: FilterBuilderClause;
  syncDefaultFilters?: boolean;
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
    syncDefaultFilters = false,
  } = props;

  const [searchNew, setSearchNew] = useState('');
  const prevFilterValueRef = useRef<unknown>(undefined);
  // Bumped each time an adopted value is applied. Mixed into the filter row keys
  // so the value inputs (which seed their own local state on mount) remount and
  // re-read the adopted value. Only used when syncDefaultFilters is on.
  const [adoptRevision, setAdoptRevision] = useState(0);

  const adoptDefaultFilters = useCallback(
    (clause: FilterBuilderClauseGroup) => {
      setEmbeddableState?.((prev) => {
        // Seed-once (default, backward compatible): only apply while empty.
        if (!syncDefaultFilters && prev?.filters?.length) {
          return prev;
        }
        return {
          ...prev,
          filters: clauseToFilters(clause, dimensionsAndMeasures),
          operator: clause.operator,
        };
      });
      if (syncDefaultFilters) {
        setAdoptRevision((revision) => revision + 1);
      }
    },
    [dimensionsAndMeasures, setEmbeddableState, syncDefaultFilters],
  );

  useAdoptDefaultFilters({
    defaultFilters,
    dimensionsAndMeasures,
    lastEmittedRef: prevFilterValueRef,
    adopt: adoptDefaultFilters,
  });

  const lastFilterId = embeddableState?.filters?.[embeddableState.filters.length - 1]?.id ?? 0;

  const newFilter = useCallback(
    (dimensionOrMeasureValue: string | null = null): FilterBuilderFilter =>
      createEmptyFilter(lastFilterId + 1, dimensionsAndMeasures, dimensionOrMeasureValue),
    [dimensionsAndMeasures, lastFilterId],
  );

  const filters = useMemo(
    () => (embeddableState?.filters?.length ? embeddableState.filters : [newFilter()]),
    [embeddableState?.filters, newFilter],
  );
  const operator = embeddableState?.operator ?? filterBuilderAndOrOperator.AND;

  const { scrollRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight, scrollToEnd } =
    useFilterBuilderScroll({
      itemsSignature: filters,
      autoScrollKey: getLastFilterKey(filters),
    });

  const handleOperatorChange = (value: FilterBuilderAndOrOperator) => {
    setEmbeddableState?.((prev) => ({ ...prev, operator: value }));
  };

  const updateFilters = useCallback(
    (updater: (filters: FilterBuilderFilter[]) => FilterBuilderFilter[]) => {
      setEmbeddableState?.((prev) => ({
        ...prev,
        filters: updater([...(prev?.filters ?? [])]),
      }));
    },
    [setEmbeddableState],
  );

  const handleSelectDimensionOrMeasure = (index: number, name: string | null) => {
    updateFilters((f) => {
      const existing = f[index];
      f[index] = { ...newFilter(name), ...(existing?.id ? { id: existing.id } : {}) };
      return f;
    });
  };

  const handleSelectOperator = (index: number, operator: string | null) => {
    updateFilters((f) => {
      f[index] = { ...f[index]!, operator, value: null };
      return f;
    });
  };

  const handleSelectValue = (index: number, value: FilterBuilderFilter['value']) => {
    updateFilters((f) => {
      f[index] = { ...f[index]!, value };
      return f;
    });
  };

  const handleDimensionSearch = (index: number, search: string) => {
    updateFilters((f) => {
      f[index] = { ...f[index]!, search };
      return f;
    });
  };

  const handleDeleteFilter = (index: number) => {
    updateFilters((f) => {
      f.splice(index, 1);
      return f;
    });
  };

  const handleAddFilter = (value: string | null) => {
    updateFilters((f) => [...f, newFilter(value)]);
    scrollToEnd();
  };

  const supportedDimensionsAndMeasures = getSupportedDimensionsAndMeasures(dimensionsAndMeasures);

  const dimensionOptionsNew = getDimensionAndMeasureOptions({
    dimensionsAndMeasures: supportedDimensionsAndMeasures,
    searchValue: searchNew,
    theme,
  });

  const hasClearAll = filters.some((f) => f.dimensionOrMeasure && f.operator && f.value != null);

  const hasMixedTypes = hasMixedDimensionsAndMeasures(filters);

  const isMixedOrOperator = hasMixedTypes && operator === filterBuilderAndOrOperator.OR;

  useEffect(() => {
    if (isMixedOrOperator) {
      setEmbeddableState?.((prev) => ({ ...prev, operator: filterBuilderAndOrOperator.AND }));
    }
  }, [isMixedOrOperator, setEmbeddableState]);

  useEffect(() => {
    if (isMixedOrOperator) return;
    const filterValue = filtersToClause(operator, filters);
    const serialized = JSON.stringify(filterValue);
    if (serialized === JSON.stringify(prevFilterValueRef.current)) return;
    prevFilterValueRef.current = filterValue;
    onChange?.(filterValue);
  }, [filters, operator, onChange, isMixedOrOperator]);

  const handleClearAll = () => {
    setEmbeddableState?.((prev: FilterBuilderState) => ({
      ...prev,
      filters: [newFilter()],
      operator: filterBuilderAndOrOperator.AND,
    }));
  };

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <div className={styles.container}>
        {canScrollLeft && (
          <button type="button" className={styles.scrollLeftButton} onClick={scrollLeft}>
            <IconChevronLeft />
          </button>
        )}
        <div className={styles.scroll} ref={scrollRef}>
          {filters.map((filter, index) => (
            <React.Fragment key={syncDefaultFilters ? `${filter.id}-${adoptRevision}` : filter.id}>
              {index > 0 && (
                <FilterBuilderProAndOrButton
                  operator={operator}
                  onChange={handleOperatorChange}
                  disabled={hasMixedTypes}
                />
              )}
              <FilterBuilderItem
                filter={filter}
                dimensionsAndMeasures={dimensionsAndMeasures}
                results={
                  (props as Record<string, unknown>)[`filterResults${filter.id}`] as
                    DataResponse | undefined
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
          <button type="button" className={styles.scrollRightButton} onClick={scrollRight}>
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
            noOptionsMessage={i18n.t('common.noOptionsFound')}
          />
        )}
        {hasClearAll && (
          <button type="button" className={styles.clearButton} onClick={handleClearAll}>
            {i18n.t('editors.filterBuilder.clearAll')}
          </button>
        )}
      </div>
    </EditorCard>
  );
};

export default FilterBuilderPro;
