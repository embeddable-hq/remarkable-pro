import { DataResponse, DimensionOrMeasure, isDimension, isMeasure } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Theme } from '../../../../theme/theme.types';
import FilterBuilderItem from './components/FilterBuilderItem';
import { FilterBuilderFilter, FilterBuilderState } from './definition';
import { ActionIcon, SingleSelectField } from '@embeddable.com/remarkable-ui';
import { IconPlus, IconChevronRight, IconChevronLeft } from '@tabler/icons-react';
import styles from './FilterBuilderPro.module.css';
import {
  filterBuilderAndOrOperator,
  FilterBuilderAndOrOperator,
  filtersToClause,
  getSupportedDimensionsAndMeasures,
  clauseToFilters,
  FilterBuilderClause,
} from './FilterBuilderPro.utils';
import { FilterBuilderProAndOrButton } from './components/FilterBuilderProAndOrButton';
import { i18n, i18nSetup } from '../../../../theme/i18n/i18n';
import { getDimensionAndMeasureOptions } from '../../utils/dimensionsAndMeasures.utils';
import { resolveI18nProps } from '../../../component.utils';
import { EditorCard, EditorCardHeaderProps } from '../../shared/EditorCard/EditorCard';
import { useFilterBuilderScroll } from '../filters.hooks';

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
  const prevFilterValueRef = useRef<unknown>(undefined);

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
  }, [defaultFilters, dimensionsAndMeasures, setEmbeddableState]);

  const lastFilterId = embeddableState?.filters?.[embeddableState.filters.length - 1]?.id ?? 0;

  const newFilter = useCallback(
    (dimensionOrMeasureValue: string | null = null): FilterBuilderFilter => {
      const dimensionOrMeasure =
        dimensionsAndMeasures.find((d) => d.name === dimensionOrMeasureValue) ?? null;

      return { id: lastFilterId + 1, dimensionOrMeasure, search: '', operator: null, value: null };
    },
    [dimensionsAndMeasures, lastFilterId],
  );

  const filters = useMemo(
    () => (embeddableState?.filters?.length ? embeddableState.filters : [newFilter()]),
    [embeddableState?.filters, newFilter],
  );
  const operator = embeddableState?.operator ?? filterBuilderAndOrOperator.AND;

  const lastFilter = filters[filters.length - 1];
  const lastFilterKey = `${lastFilter?.id}-${lastFilter?.dimensionOrMeasure?.name}-${lastFilter?.operator}-${JSON.stringify(lastFilter?.value)}`;

  const { scrollRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight, scrollToEnd } =
    useFilterBuilderScroll({
      itemsSignature: filters,
      autoScrollKey: lastFilterKey,
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

  // OR cannot combine dimensions (row-level WHERE) with measures (aggregate HAVING)
  // in Cube. This depends on which members are *selected*, not whether their values
  // are filled in — a measure mid-edit (e.g. value cleared after an operator change)
  // still makes the set mixed, so we must not look only at "complete" filters.
  const hasMixedTypes =
    filters.some((f) => isDimension(f.dimensionOrMeasure ?? undefined)) &&
    filters.some((f) => isMeasure(f.dimensionOrMeasure ?? undefined));

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
            <React.Fragment key={filter.id}>
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
