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
  createEmptyFilter,
  getLastFilterKey,
  getSupportedDimensionsAndMeasures,
  hasMixedDimensionsAndMeasures,
} from '../filters.utils';
import { useFilterBuilderScroll } from '../filters.hooks';
import {
  clauseToItems,
  FilterBuilderGroupingState,
  FilterBuilderNode,
  getFilterNodes,
  getHighestNodeId,
  isFilterBuilderGroup,
  itemsToClause,
  sanitizeMixedTypeOperators,
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
    (id: number, name: string | null = null): FilterBuilderFilter =>
      createEmptyFilter(id, dimensionsAndMeasures, name),
    [dimensionsAndMeasures],
  );

  const emptyItems = useMemo<FilterBuilderNode[]>(() => [makeFilter(1)], [makeFilter]);

  const storedItems = getFilterNodes(embeddableState);
  const items = storedItems.length ? storedItems : emptyItems;
  const operator = embeddableState?.operator ?? AND;

  useEffect(() => {
    if (!defaultFilters || !dimensionsAndMeasures?.length) return;

    const newItems = clauseToItems(defaultFilters, dimensionsAndMeasures);

    if (newItems.length > 0) {
      setEmbeddableState?.((prev) => {
        if (getFilterNodes(prev).length) return prev;
        return { ...prev, operator: defaultFilters.operator, items: newItems };
      });
    }
  }, [defaultFilters, dimensionsAndMeasures, setEmbeddableState]);

  const allFilters = items.flatMap((node) => (isFilterBuilderGroup(node) ? node.filters : [node]));

  const { scrollRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight, scrollToEnd } =
    useFilterBuilderScroll({
      itemsSignature: items,
      autoScrollKey: getLastFilterKey(allFilters),
    });

  const handleOperatorChange = (value: FilterBuilderAndOrOperator) => {
    setEmbeddableState?.((prev) => ({ ...prev, operator: value }));
  };

  const updateItems = useCallback(
    (updater: (items: FilterBuilderNode[]) => FilterBuilderNode[]) => {
      setEmbeddableState?.((prev) => {
        const stored = getFilterNodes(prev);
        const base = stored.length ? stored : [makeFilter(1)];
        return { ...prev, items: updater([...base]) };
      });
    },
    [setEmbeddableState, makeFilter],
  );

  // All the handlers below dispatch by the node/filter's stable id rather than
  // its array position. Callbacks can resolve asynchronously (e.g. a debounced
  // number/text input) after the list has been reordered by a delete or an
  // insertion elsewhere — an index captured at render time could then land on
  // the wrong item, whereas an id always finds the same item or no longer
  // matches at all.
  const patchFilter = (
    id: number,
    patch: Partial<FilterBuilderFilter> | ((filter: FilterBuilderFilter) => FilterBuilderFilter),
  ) =>
    updateItems((current) => {
      const index = current.findIndex((node) => !isFilterBuilderGroup(node) && node.id === id);
      if (index === -1) return current;
      const node = current[index] as FilterBuilderFilter;
      current[index] = typeof patch === 'function' ? patch(node) : { ...node, ...patch };
      return current;
    });

  const handleSelectDimensionOrMeasure = (id: number, name: string | null) =>
    patchFilter(id, (node) => makeFilter(node.id, name));

  const handleSelectOperator = (id: number, value: string | null) =>
    patchFilter(id, { operator: value, value: null });

  const handleSelectValue = (id: number, value: FilterBuilderFilter['value']) =>
    patchFilter(id, { value });

  const handleDimensionSearch = (id: number, search: string) => patchFilter(id, { search });

  const handleDeleteItem = (id: number) =>
    updateItems((current) => {
      const index = current.findIndex((node) => node.id === id);
      if (index === -1) return current;
      current.splice(index, 1);
      return current;
    });

  const handleCreateGroup = (id: number, name: string | null) =>
    updateItems((current) => {
      const index = current.findIndex((node) => !isFilterBuilderGroup(node) && node.id === id);
      if (index === -1) return current;
      const node = current[index] as FilterBuilderFilter;
      const maxId = getHighestNodeId(current);
      current[index] = {
        id: maxId + 1,
        operator: AND,
        filters: [node, makeFilter(maxId + 2, name)],
      };
      return current;
    });

  const findGroupIndex = (current: FilterBuilderNode[], groupId: number) =>
    current.findIndex((node) => isFilterBuilderGroup(node) && node.id === groupId);

  const patchGroupFilter = (
    groupId: number,
    filterId: number,
    patch: Partial<FilterBuilderFilter> | ((filter: FilterBuilderFilter) => FilterBuilderFilter),
  ) =>
    updateItems((current) => {
      const groupIndex = findGroupIndex(current, groupId);
      const group = current[groupIndex];
      if (!group || !isFilterBuilderGroup(group)) return current;
      const filters = group.filters.map((filter) =>
        filter.id === filterId
          ? typeof patch === 'function'
            ? patch(filter)
            : { ...filter, ...patch }
          : filter,
      );
      current[groupIndex] = { ...group, filters };
      return current;
    });

  const handleGroupOperatorChange = (groupId: number, value: FilterBuilderAndOrOperator) =>
    updateItems((current) => {
      const groupIndex = findGroupIndex(current, groupId);
      const group = current[groupIndex];
      if (!group || !isFilterBuilderGroup(group)) return current;
      current[groupIndex] = { ...group, operator: value };
      return current;
    });

  const handleDeleteGroupFilter = (groupId: number, filterId: number) =>
    updateItems((current) => {
      const groupIndex = findGroupIndex(current, groupId);
      const group = current[groupIndex];
      if (!group || !isFilterBuilderGroup(group)) return current;
      const filters = group.filters.filter((filter) => filter.id !== filterId);
      if (filters.length === 0) current.splice(groupIndex, 1);
      else if (filters.length === 1) current[groupIndex] = filters[0]!;
      else current[groupIndex] = { ...group, filters };
      return current;
    });

  const handleAddToGroup = (groupId: number, name: string | null) =>
    updateItems((current) => {
      const groupIndex = findGroupIndex(current, groupId);
      const group = current[groupIndex];
      if (!group || !isFilterBuilderGroup(group)) return current;
      current[groupIndex] = {
        ...group,
        filters: [...group.filters, makeFilter(getHighestNodeId(current) + 1, name)],
      };
      return current;
    });

  const handleAddFilter = (value: string | null) => {
    updateItems((current) => [...current, makeFilter(getHighestNodeId(current) + 1, value)]);
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

  const hasClearAll = allFilters.some((f) => f.dimensionOrMeasure && f.operator && f.value != null);
  const topDisabled = hasMixedDimensionsAndMeasures(allFilters);

  const sanitized = sanitizeMixedTypeOperators(items, operator);

  useEffect(() => {
    if (!sanitized.changed) return;
    setEmbeddableState?.((prev) => {
      const next = sanitizeMixedTypeOperators(getFilterNodes(prev), prev?.operator ?? AND);
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
                  disableOr={hasMixedDimensionsAndMeasures(node.filters)}
                  results={getResults}
                  onOperatorChange={(value) => handleGroupOperatorChange(node.id, value)}
                  onSelectDimensionOrMeasure={(filterId, value) =>
                    patchGroupFilter(node.id, filterId, (f) => makeFilter(f.id, value))
                  }
                  onSelectOperator={(filterId, value) =>
                    patchGroupFilter(node.id, filterId, { operator: value, value: null })
                  }
                  onSelectValue={(filterId, value) =>
                    patchGroupFilter(node.id, filterId, { value })
                  }
                  onSearchValue={(filterId, value) =>
                    patchGroupFilter(node.id, filterId, { search: value })
                  }
                  onDeleteFilter={(filterId) => handleDeleteGroupFilter(node.id, filterId)}
                  onAddFilter={(value) => handleAddToGroup(node.id, value)}
                />
              ) : (
                <FilterBuilderWithGroupingItem
                  filter={node}
                  dimensionsAndMeasures={dimensionsAndMeasures}
                  results={getResults(node.id)}
                  theme={theme}
                  onSelectDimensionOrMeasure={(value) =>
                    handleSelectDimensionOrMeasure(node.id, value)
                  }
                  onSelectOperator={(value) => handleSelectOperator(node.id, value)}
                  onSelectValue={(value) => handleSelectValue(node.id, value)}
                  onSearchValue={(value) => handleDimensionSearch(node.id, value)}
                  onDelete={() => handleDeleteItem(node.id)}
                  onCreateGroup={(value) => handleCreateGroup(node.id, value)}
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
