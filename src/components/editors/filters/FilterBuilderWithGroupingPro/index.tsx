import { DataResponse, DimensionOrMeasure } from '@embeddable.com/core';
import { useTheme } from '@embeddable.com/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Theme } from '../../../../theme/theme.types';
import { SingleSelectField } from '@embeddable.com/remarkable-ui';
import { IconPlus, IconChevronRight, IconChevronLeft } from '@tabler/icons-react';
import styles from './FilterBuilderWithGroupingPro.module.css';
import {
  FilterBuilderAndOrOperator,
  filterBuilderAndOrOperator,
  FilterBuilderClause,
  FilterBuilderFilter,
  getSupportedDimensionsAndMeasures,
} from '../filters.utils';
import { useFilterBuilderScroll } from '../filters.hooks';
import {
  clauseToItems,
  FilterBuilderGroupingState,
  FilterBuilderNode,
  getItems,
  getMaxNodeId,
  isFilterBuilderGroup,
  itemsToClause,
  sanitizeOperators,
  scopeIsMixed,
} from './FilterBuilderWithGroupingPro.utils';
import FilterBuilderWithGroupingItem from './components/FilterBuilderWithGroupingItem';
import FilterBuilderWithGroupingGroup from './components/FilterBuilderWithGroupingGroup';
import { FilterBuilderWithGroupingAndOrButton } from './components/FilterBuilderWithGroupingAndOrButton';
import { i18n, i18nSetup } from '../../../../theme/i18n/i18n';
import { getDimensionAndMeasureOptions } from '../../utils/dimensionsAndMeasures.utils';
import { resolveI18nProps } from '../../../component.utils';
import { EditorCard, EditorCardHeaderProps } from '../../shared/EditorCard/EditorCard';

const { AND } = { AND: filterBuilderAndOrOperator.AND };

export type FilterBuilderWithGroupingProProps = {
  embeddableState?: FilterBuilderGroupingState;
  setEmbeddableState?: (
    state:
      | FilterBuilderGroupingState
      | ((prev: FilterBuilderGroupingState) => FilterBuilderGroupingState),
  ) => void;
  dimensionsAndMeasures?: DimensionOrMeasure[];
  onChange?: (value: unknown) => void;
  defaultFilters?: FilterBuilderClause;
} & EditorCardHeaderProps;

const FilterBuilderWithGroupingPro = (props: FilterBuilderWithGroupingProProps) => {
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

  const makeFilter = useCallback(
    (id: number, name: string | null = null): FilterBuilderFilter => ({
      id,
      dimensionOrMeasure: dimensionsAndMeasures.find((d) => d.name === name) ?? null,
      search: '',
      operator: null,
      value: null,
    }),
    [dimensionsAndMeasures],
  );

  const emptyItems = useMemo<FilterBuilderNode[]>(() => [makeFilter(1)], [makeFilter]);

  const storedItems = getItems(embeddableState);
  const items = storedItems.length ? storedItems : emptyItems;
  const operator = embeddableState?.operator ?? AND;

  useEffect(() => {
    if (!defaultFilters || !dimensionsAndMeasures?.length) return;

    const newItems = clauseToItems(defaultFilters, dimensionsAndMeasures);

    if (newItems.length > 0) {
      setEmbeddableState?.((prev) => {
        if (getItems(prev).length) return prev;
        return { ...prev, operator: defaultFilters.operator, items: newItems };
      });
    }
  }, [defaultFilters, dimensionsAndMeasures, setEmbeddableState]);

  const allLeaves = items.flatMap((node) => (isFilterBuilderGroup(node) ? node.filters : [node]));
  const lastLeaf = allLeaves[allLeaves.length - 1];
  const lastFilterKey = `${lastLeaf?.id}-${lastLeaf?.dimensionOrMeasure?.name}-${lastLeaf?.operator}-${JSON.stringify(lastLeaf?.value)}`;

  const { scrollRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight, scrollToEnd } =
    useFilterBuilderScroll({
      itemsSignature: items,
      autoScrollKey: lastFilterKey,
    });

  const handleOperatorChange = (value: FilterBuilderAndOrOperator) => {
    setEmbeddableState?.((prev) => ({ ...prev, operator: value }));
  };

  const updateItems = useCallback(
    (updater: (items: FilterBuilderNode[]) => FilterBuilderNode[]) => {
      setEmbeddableState?.((prev) => {
        const stored = getItems(prev);
        const base = stored.length ? stored : [makeFilter(1)];
        return { ...prev, items: updater([...base]) };
      });
    },
    [setEmbeddableState, makeFilter],
  );

  const patchLeaf = (
    index: number,
    patch: Partial<FilterBuilderFilter> | ((filter: FilterBuilderFilter) => FilterBuilderFilter),
  ) =>
    updateItems((current) => {
      const node = current[index];
      if (!node || isFilterBuilderGroup(node)) return current;
      current[index] = typeof patch === 'function' ? patch(node) : { ...node, ...patch };
      return current;
    });

  const handleSelectDimensionOrMeasure = (index: number, name: string | null) =>
    patchLeaf(index, (node) => makeFilter(node.id, name));

  const handleSelectOperator = (index: number, value: string | null) =>
    patchLeaf(index, { operator: value, value: null });

  const handleSelectValue = (index: number, value: FilterBuilderFilter['value']) =>
    patchLeaf(index, { value });

  const handleDimensionSearch = (index: number, search: string) => patchLeaf(index, { search });

  const handleDeleteItem = (index: number) =>
    updateItems((current) => {
      current.splice(index, 1);
      return current;
    });

  const handleCreateGroup = (index: number, name: string | null) =>
    updateItems((current) => {
      const node = current[index];
      if (!node || isFilterBuilderGroup(node)) return current;
      const maxId = getMaxNodeId(current);
      current[index] = {
        id: maxId + 1,
        operator: AND,
        filters: [node, makeFilter(maxId + 2, name)],
      };
      return current;
    });

  const patchGroupFilter = (
    itemIndex: number,
    filterIndex: number,
    patch: Partial<FilterBuilderFilter> | ((filter: FilterBuilderFilter) => FilterBuilderFilter),
  ) =>
    updateItems((current) => {
      const group = current[itemIndex];
      if (!isFilterBuilderGroup(group)) return current;
      const filters = [...group.filters];
      const filter = filters[filterIndex];
      if (!filter) return current;
      filters[filterIndex] = typeof patch === 'function' ? patch(filter) : { ...filter, ...patch };
      current[itemIndex] = { ...group, filters };
      return current;
    });

  const handleGroupOperatorChange = (itemIndex: number, value: FilterBuilderAndOrOperator) =>
    updateItems((current) => {
      const group = current[itemIndex];
      if (!isFilterBuilderGroup(group)) return current;
      current[itemIndex] = { ...group, operator: value };
      return current;
    });

  const handleDeleteGroupFilter = (itemIndex: number, filterIndex: number) =>
    updateItems((current) => {
      const group = current[itemIndex];
      if (!isFilterBuilderGroup(group)) return current;
      const filters = group.filters.filter((_, i) => i !== filterIndex);
      if (filters.length === 0) current.splice(itemIndex, 1);
      else if (filters.length === 1) current[itemIndex] = filters[0]!;
      else current[itemIndex] = { ...group, filters };
      return current;
    });

  const handleAddToGroup = (itemIndex: number, name: string | null) =>
    updateItems((current) => {
      const group = current[itemIndex];
      if (!isFilterBuilderGroup(group)) return current;
      current[itemIndex] = {
        ...group,
        filters: [...group.filters, makeFilter(getMaxNodeId(current) + 1, name)],
      };
      return current;
    });

  const handleAddFilter = (value: string | null) => {
    updateItems((current) => [...current, makeFilter(getMaxNodeId(current) + 1, value)]);
    scrollToEnd();
  };

  const handleClearAll = () => {
    setEmbeddableState?.((prev) => ({ ...prev, items: [makeFilter(1)], operator: AND }));
  };

  const supportedDimensionsAndMeasures = getSupportedDimensionsAndMeasures(dimensionsAndMeasures);
  const dimensionOptionsNew = getDimensionAndMeasureOptions({
    dimensionsAndMeasures: supportedDimensionsAndMeasures,
    searchValue: searchNew,
    theme,
  });

  const hasClearAll = allLeaves.some((f) => f.dimensionOrMeasure && f.operator && f.value != null);
  const topDisabled = scopeIsMixed(allLeaves);

  const sanitized = sanitizeOperators(items, operator);

  useEffect(() => {
    if (!sanitized.changed) return;
    setEmbeddableState?.((prev) => {
      const next = sanitizeOperators(getItems(prev), prev?.operator ?? AND);
      if (!next.changed) return prev;
      return { ...prev, items: next.items, operator: next.operator };
    });
  }, [sanitized.changed, setEmbeddableState]);

  useEffect(() => {
    const filterValue = itemsToClause(sanitized.operator, sanitized.items);
    const serialized = JSON.stringify(filterValue);
    if (serialized === JSON.stringify(prevFilterValueRef.current)) return;
    prevFilterValueRef.current = filterValue;
    onChange?.(filterValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(itemsToClause(sanitized.operator, sanitized.items)), onChange]);

  const getResults = (id: number) =>
    (props as Record<string, unknown>)[`filterResults${id}`] as DataResponse | undefined;

  const firstItem = items[0];
  const showAddFilter = Boolean(
    firstItem && (isFilterBuilderGroup(firstItem) || firstItem.dimensionOrMeasure),
  );

  return (
    <EditorCard title={title} description={description} tooltip={tooltip}>
      <div className={styles.container}>
        {canScrollLeft && (
          <button type="button" className={styles.scrollLeftButton} onClick={scrollLeft}>
            <IconChevronLeft />
          </button>
        )}
        <div className={styles.scroll} ref={scrollRef}>
          {items.map((node, index) => (
            <React.Fragment key={node.id}>
              {index > 0 && (
                <FilterBuilderWithGroupingAndOrButton
                  operator={operator}
                  onChange={handleOperatorChange}
                  disabled={topDisabled}
                />
              )}
              {isFilterBuilderGroup(node) ? (
                <FilterBuilderWithGroupingGroup
                  group={node}
                  dimensionsAndMeasures={dimensionsAndMeasures}
                  theme={theme}
                  disableOr={scopeIsMixed(node.filters)}
                  results={getResults}
                  onOperatorChange={(value) => handleGroupOperatorChange(index, value)}
                  onSelectDimensionOrMeasure={(fi, value) =>
                    patchGroupFilter(index, fi, (f) => makeFilter(f.id, value))
                  }
                  onSelectOperator={(fi, value) =>
                    patchGroupFilter(index, fi, { operator: value, value: null })
                  }
                  onSelectValue={(fi, value) => patchGroupFilter(index, fi, { value })}
                  onSearchValue={(fi, value) => patchGroupFilter(index, fi, { search: value })}
                  onDeleteFilter={(fi) => handleDeleteGroupFilter(index, fi)}
                  onAddFilter={(value) => handleAddToGroup(index, value)}
                />
              ) : (
                <FilterBuilderWithGroupingItem
                  filter={node}
                  dimensionsAndMeasures={dimensionsAndMeasures}
                  results={getResults(node.id)}
                  theme={theme}
                  onSelectDimensionOrMeasure={(value) =>
                    handleSelectDimensionOrMeasure(index, value)
                  }
                  onSelectOperator={(value) => handleSelectOperator(index, value)}
                  onSelectValue={(value) => handleSelectValue(index, value)}
                  onSearchValue={(value) => handleDimensionSearch(index, value)}
                  onDelete={() => handleDeleteItem(index)}
                  onCreateGroup={(value) => handleCreateGroup(index, value)}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        {canScrollRight && (
          <button type="button" className={styles.scrollRightButton} onClick={scrollRight}>
            <IconChevronRight />
          </button>
        )}

        {showAddFilter && (
          <SingleSelectField
            triggerComponent={
              <button type="button" className={styles.addButton}>
                <IconPlus />
                <span>{i18n.t('editors.filterBuilder.addFilter')}</span>
              </button>
            }
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

export default FilterBuilderWithGroupingPro;
