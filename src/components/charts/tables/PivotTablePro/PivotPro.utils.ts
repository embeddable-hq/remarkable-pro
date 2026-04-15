import { Dimension, Measure } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { PivotTableProps } from '@embeddable.com/remarkable-ui';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const getPivotMeasures = (
  props: { measures: Measure[]; displayNullAs?: string; allowFormatting?: boolean },
  theme: Theme,
): PivotTableProps<any>['measures'] => {
  const themeFormatter = getThemeFormatter(theme);

  return props.measures.map((measure) => {
    return {
      key: measure.name,
      label: props.allowFormatting
        ? themeFormatter.dimensionOrMeasureTitle(measure)
        : measure.title,
      showAsPercentage: Boolean(measure.inputs?.showAsPercentage),
      percentageDecimalPlaces: measure.inputs?.decimalPlaces ?? 1,
      accessor: (row) => {
        const value = row[measure.name];

        if (!props.allowFormatting) {
          return value;
        }

        return value == null
          ? props.displayNullAs
          : themeFormatter.data(measure, row[measure.name]);
      },
    };
  });
};

export const getPivotDimension = (
  props: { dimension: Dimension; allowFormatting?: boolean },
  theme: Theme,
): PivotTableProps<any>['rowDimension' | 'columnDimension'] => {
  const themeFormatter = getThemeFormatter(theme);

  return {
    key: props.dimension.name,
    label: props.allowFormatting
      ? themeFormatter.dimensionOrMeasureTitle(props.dimension)
      : props.dimension.title,
    formatValue: (value: string) =>
      props.allowFormatting ? themeFormatter.data(props.dimension, value) : value,
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
