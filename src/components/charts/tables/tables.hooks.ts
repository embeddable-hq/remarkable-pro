import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { useMemo } from 'react';

type Order = 'asc' | 'desc' | 'equal';

function getTablePredominantOrder(arr: (string | number | boolean)[]): Order {
  let asc = 0;
  let desc = 0;

  for (let i = 0; i < arr.length - 1; i++) {
    const a = arr[i];
    const b = arr[i + 1];

    if (a == null || b == null) continue;

    if (a < b) asc++;
    else if (a > b) desc++;
  }

  if (asc > desc) return 'asc';
  if (desc > asc) return 'desc';
  return 'equal';
}

function isTableOrderMixed(arr: (string | number | boolean)[]): boolean {
  let asc = 0;
  let desc = 0;

  for (let i = 0; i < arr.length - 1; i++) {
    const a = arr[i];
    const b = arr[i + 1];

    if (a == null || b == null) continue;

    if (a < b) asc++;
    else if (a > b) desc++;
  }

  return asc > 0 && desc > 0;
}

const getTableSortComparator = (order: Order) => {
  return <T>(a: T, b: T) => {
    if (order === 'asc') {
      return a < b ? -1 : a > b ? 1 : 0;
    }
    if (order === 'desc') {
      return a > b ? -1 : a < b ? 1 : 0;
    }
    return 0;
  };
};

type useGetTableSortedResultsProps = {
  results: DataResponse;
  columnOrder: (string | number | boolean)[];
  rowOrder: (string | number | boolean)[];
  columnDimension: Dimension;
  rowDimension: Dimension;
  measures: Measure[];
};

export const getTableSortedResults = (props: useGetTableSortedResultsProps) => {
  const data = props.results.data ?? [];
  const firstRow = data[0];

  if (!firstRow) return [];

  const buildEmptyMeasures = () =>
    props.measures.reduce<Record<string, unknown>>((acc, measure) => {
      acc[measure.name] = undefined;
      return acc;
    }, {});

  const reorderByAxis = (
    inputData: Record<string, unknown>[],
    axisOrder: (string | number | boolean)[],
    axisDimension: Dimension,
    fixedDimension: Dimension,
  ) => {
    if (!isTableOrderMixed(axisOrder)) {
      return inputData;
    }

    const order = getTablePredominantOrder(axisOrder);
    const sortedAxisOrder = [...axisOrder].sort(getTableSortComparator(order));

    // "Leader" rows: one per value in the axis order, at the fixed dimension's first value
    const leaderRows = sortedAxisOrder.map((value) => {
      const existing = inputData.find(
        (x) =>
          x[axisDimension.name] === value &&
          x[fixedDimension.name] === firstRow[fixedDimension.name],
      );

      if (existing) return existing;

      return {
        ...firstRow,
        [axisDimension.name]: value,
        ...buildEmptyMeasures(),
      };
    });

    // Remove rows that are already covered by leaderRows (same [axis, fixed] tuple)
    const restResults = inputData.filter(
      (resultRow) =>
        !leaderRows.some(
          (leaderRow) =>
            leaderRow[axisDimension.name] === resultRow[axisDimension.name] &&
            leaderRow[fixedDimension.name] === resultRow[fixedDimension.name],
        ),
    );

    return [...leaderRows, ...restResults];
  };

  // Apply both sorts sequentially: fix columns first, then rows
  let result = reorderByAxis(data, props.columnOrder, props.columnDimension, props.rowDimension);
  result = reorderByAxis(result, props.rowOrder, props.rowDimension, props.columnDimension);

  return result;
};

export const useGetTableSortedResults = (props: useGetTableSortedResultsProps) => {
  const results = useMemo(() => {
    return getTableSortedResults(props);
  }, [props]);
  return results;
};
