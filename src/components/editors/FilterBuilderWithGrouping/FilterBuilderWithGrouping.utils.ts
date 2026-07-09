import { DimensionOrMeasure, isDimension, isMeasure } from '@embeddable.com/core';
import {
  clauseToFilter,
  FilterBuilderAndOrOperator,
  filterBuilderAndOrOperator,
  FilterBuilderClause,
  FilterBuilderFilter,
  filterToClause,
} from '../utils/filterBuilder.utils';

export type FilterBuilderGroup = {
  id: number;
  operator: FilterBuilderAndOrOperator;
  filters: FilterBuilderFilter[];
};

export type FilterBuilderNode = FilterBuilderFilter | FilterBuilderGroup;

export type FilterBuilderGroupingState = {
  items?: FilterBuilderNode[];
  filters?: FilterBuilderFilter[];
  operator: FilterBuilderAndOrOperator;
};

export type FilterBuilderMemberType = DimensionOrMeasure['__type__'];

export const isFilterBuilderGroup = (
  node: FilterBuilderNode | null | undefined,
): node is FilterBuilderGroup => Array.isArray((node as FilterBuilderGroup | undefined)?.filters);

export const getItems = (state: FilterBuilderGroupingState | undefined): FilterBuilderNode[] => {
  if (state?.items?.length) return state.items;
  if (state?.filters?.length) return state.filters;
  return [];
};

export const getLeafFilters = (
  state: FilterBuilderGroupingState | undefined,
): FilterBuilderFilter[] =>
  getItems(state).flatMap((node) => (isFilterBuilderGroup(node) ? node.filters : [node]));

export const getMaxNodeId = (items: FilterBuilderNode[]): number =>
  items.reduce((max, node) => {
    const groupChildMax = isFilterBuilderGroup(node)
      ? node.filters.reduce((m, f) => Math.max(m, f.id), 0)
      : 0;
    return Math.max(max, node.id, groupChildMax);
  }, 0);

export const getGroupMemberType = (
  filters: FilterBuilderFilter[],
  excludeIndex?: number,
): FilterBuilderMemberType | null => {
  for (let i = 0; i < filters.length; i++) {
    if (i === excludeIndex) continue;
    const type = filters[i]?.dimensionOrMeasure?.__type__;
    if (type) return type;
  }
  return null;
};

export const filterByMemberType = (
  dimensionsAndMeasures: DimensionOrMeasure[],
  type: FilterBuilderMemberType | null | undefined,
): DimensionOrMeasure[] =>
  type ? dimensionsAndMeasures.filter((d) => d.__type__ === type) : dimensionsAndMeasures;

const isFilterComplete = (f: FilterBuilderFilter): boolean =>
  Boolean(f.dimensionOrMeasure && f.operator && f.value != null);

export const scopeIsMixed = (leaves: FilterBuilderFilter[]): boolean =>
  leaves.some((f) => isDimension(f.dimensionOrMeasure ?? undefined)) &&
  leaves.some((f) => isMeasure(f.dimensionOrMeasure ?? undefined));

export const itemsToClause = (
  operator: FilterBuilderAndOrOperator,
  items: FilterBuilderNode[],
): FilterBuilderClause | null => {
  const clauses = items
    .map((node): FilterBuilderClause | null => {
      if (isFilterBuilderGroup(node)) {
        const inner = node.filters.filter(isFilterComplete).flatMap(filterToClause);
        if (inner.length === 0) return null;
        if (inner.length === 1) return inner[0]!;
        return { operator: node.operator, clauses: inner };
      }
      if (!isFilterComplete(node)) return null;
      return filterToClause(node)[0]!;
    })
    .filter((clause): clause is FilterBuilderClause => clause != null);

  if (clauses.length === 0) return null;

  return { operator, clauses };
};

export const clauseToItems = (
  clause: FilterBuilderClause | null,
  dimensionsAndMeasures: DimensionOrMeasure[],
): FilterBuilderNode[] => {
  if (!clause || !('clauses' in clause)) return [];

  let nextId = 0;
  const mintId = () => (nextId += 1);

  const items: FilterBuilderNode[] = [];

  clause.clauses.forEach((subClause) => {
    if ('clauses' in subClause) {
      const asFilter = clauseToFilter(subClause, dimensionsAndMeasures, mintId());
      if (asFilter) {
        items.push(asFilter);
        return;
      }

      const filters: FilterBuilderFilter[] = [];
      subClause.clauses.forEach((inner) => {
        const filter = clauseToFilter(inner, dimensionsAndMeasures, mintId());
        if (filter) filters.push(filter);
      });
      if (filters.length) {
        items.push({ id: mintId(), operator: subClause.operator, filters });
      }
      return;
    }

    const filter = clauseToFilter(subClause, dimensionsAndMeasures, mintId());
    if (filter) items.push(filter);
  });

  return items;
};

export const sanitizeOperators = (
  items: FilterBuilderNode[],
  topOperator: FilterBuilderAndOrOperator,
): { items: FilterBuilderNode[]; operator: FilterBuilderAndOrOperator; changed: boolean } => {
  let changed = false;
  const newItems = items.map((node) => {
    if (
      isFilterBuilderGroup(node) &&
      node.operator === filterBuilderAndOrOperator.OR &&
      scopeIsMixed(node.filters)
    ) {
      changed = true;
      return { ...node, operator: filterBuilderAndOrOperator.AND };
    }
    return node;
  });
  let operator = topOperator;
  const leaves = newItems.flatMap((n) => (isFilterBuilderGroup(n) ? n.filters : [n]));
  if (operator === filterBuilderAndOrOperator.OR && scopeIsMixed(leaves)) {
    operator = filterBuilderAndOrOperator.AND;
    changed = true;
  }
  return { items: newItems, operator, changed };
};
