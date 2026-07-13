import { DimensionOrMeasure } from '@embeddable.com/core';
import {
  clauseToFilter,
  FilterBuilderAndOrOperator,
  filterBuilderAndOrOperator,
  FilterBuilderClause,
  FilterBuilderFilter,
  filterToClause,
  hasMixedDimensionsAndMeasures,
} from '../filters.utils';

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

/** Reads the top-level filter/group nodes from state, migrating the legacy
 * flat `filters` shape (pre-grouping saved dashboards) if `items` isn't set. */
export const getFilterNodes = (
  state: FilterBuilderGroupingState | undefined,
): FilterBuilderNode[] => {
  if (state?.items?.length) return state.items;
  if (state?.filters?.length) return state.filters;
  return [];
};

/** All filters in the tree, flattened out of any groups they belong to. */
export const getAllFilters = (
  state: FilterBuilderGroupingState | undefined,
): FilterBuilderFilter[] =>
  getFilterNodes(state).flatMap((node) => (isFilterBuilderGroup(node) ? node.filters : [node]));

/** Highest id in use across every top-level node and group member, so a new
 * node/filter can be minted with a guaranteed-unique id. */
export const getHighestNodeId = (items: FilterBuilderNode[]): number =>
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

export const itemsToClause = (
  operator: FilterBuilderAndOrOperator,
  items: FilterBuilderNode[],
): FilterBuilderClause | null => {
  const clauses = items
    .map((node): FilterBuilderClause | null => {
      if (isFilterBuilderGroup(node)) {
        const inner = node.filters.filter(isFilterComplete).flatMap(filterToClause);
        if (inner.length === 0) return null;
        // A single-filter group normally flattens to its bare clause. But a
        // `between` filter already serialises as a nested `{ clauses: [...] }`
        // pair, which would then be indistinguishable from a real top-level
        // between-filter on the next load — keep it wrapped as a one-clause
        // group instead so its group identity round-trips.
        if (inner.length === 1 && !('clauses' in inner[0]!)) return inner[0]!;
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

/** Clamps any OR that would illegally combine a dimension with a measure back
 * to AND — checked independently for each group and for the top level. */
export const sanitizeMixedTypeOperators = (
  items: FilterBuilderNode[],
  topOperator: FilterBuilderAndOrOperator,
): { items: FilterBuilderNode[]; operator: FilterBuilderAndOrOperator; changed: boolean } => {
  let changed = false;
  const newItems = items.map((node) => {
    if (
      isFilterBuilderGroup(node) &&
      node.operator === filterBuilderAndOrOperator.OR &&
      hasMixedDimensionsAndMeasures(node.filters)
    ) {
      changed = true;
      return { ...node, operator: filterBuilderAndOrOperator.AND };
    }
    return node;
  });
  let operator = topOperator;
  const allFilters = newItems.flatMap((n) => (isFilterBuilderGroup(n) ? n.filters : [n]));
  if (operator === filterBuilderAndOrOperator.OR && hasMixedDimensionsAndMeasures(allFilters)) {
    operator = filterBuilderAndOrOperator.AND;
    changed = true;
  }
  return { items: newItems, operator, changed };
};
