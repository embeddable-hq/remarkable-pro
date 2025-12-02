import { DataResponse, Dimension, Measure } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { PivotTableProps } from '@embeddable.com/remarkable-ui';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const getPivotMeasures = (
  props: { measures: Measure[]; displayNullAs?: string },
  theme: Theme,
): PivotTableProps<any>['measures'] => {
  const themeFormatter = getThemeFormatter(theme);

  return props.measures.map((measure) => {
    return {
      key: measure.name,
      label: themeFormatter.dimensionOrMeasureTitle(measure),
      showAsPercentage: Boolean(measure.inputs?.showAsPercentage),
      percentageDecimalPlaces: measure.inputs?.decimalPlaces ?? 1,
      accessor: (row) => {
        const value = row[measure.name];

        return value == null
          ? props.displayNullAs
          : themeFormatter.data(measure, row[measure.name]);
      },
    };
  });
};

export const getPivotDimension = (
  props: { dimension: Dimension },
  theme: Theme,
): PivotTableProps<any>['rowDimension' | 'columnDimension'] => {
  const themeFormatter = getThemeFormatter(theme);

  return {
    key: props.dimension.name,
    label: themeFormatter.dimensionOrMeasureTitle(props.dimension),
    formatValue: (value: string) => themeFormatter.data(props.dimension, value),
  };
};

export const getPivotColumnTotalsFor = (
  measures: Measure[],
): PivotTableProps<any>['columnTotalsFor'] | undefined => {
  return measures.filter((m) => m.inputs?.showColumnTotal).map((m) => m.name);
};

export const getPivotRowTotalsFor = (
  measures: Measure[],
): PivotTableProps<any>['rowTotalsFor'] | undefined => {
  return measures.filter((m) => m.inputs?.showRowTotal).map((m) => m.name);
};

type Order = 'asc' | 'desc' | 'equal';

function predominantOrder(arr: (string | number | boolean)[]): Order {
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

function isOrderMixed(arr: (string | number | boolean)[]): boolean {
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

const getSortComparator = (order: Order) => {
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

export const getPivotTableRows = (
  results: DataResponse,
  columnOrder: (string | number | boolean)[],
  rowOrder: (string | number | boolean)[],
  columnDimension: Dimension,
  rowDimension: Dimension,
  measures: Measure[],
) => {
  const data = results.data ?? [];
  const firstRow = data[0];

  if (!firstRow) return [];

  const buildEmptyMeasures = () =>
    measures.reduce<Record<string, unknown>>((acc, measure) => {
      acc[measure.name] = undefined;
      return acc;
    }, {});

  const reorderByAxis = (
    axisOrder: (string | number | boolean)[],
    axisDimension: Dimension,
    fixedDimension: Dimension,
  ) => {
    if (!isOrderMixed(axisOrder)) {
      return data;
    }

    const order = predominantOrder(axisOrder);
    const sortedAxisOrder = [...axisOrder].sort(getSortComparator(order));

    // “Leader” rows: one per value in the axis order, at the fixed dimension’s first value
    const leaderRows = sortedAxisOrder.map((value) => {
      const existing = data.find(
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
    const restResults = data.filter(
      (resultRow) =>
        !leaderRows.some(
          (leaderRow) =>
            leaderRow[axisDimension.name] === resultRow[axisDimension.name] &&
            leaderRow[fixedDimension.name] === resultRow[fixedDimension.name],
        ),
    );

    return [...leaderRows, ...restResults];
  };

  // Preserve original behavior: fix columns if mixed, otherwise rows if mixed
  if (isOrderMixed(columnOrder)) {
    return reorderByAxis(columnOrder, columnDimension, rowDimension);
  }

  if (isOrderMixed(rowOrder)) {
    return reorderByAxis(rowOrder, rowDimension, columnDimension);
  }

  return data;
};
