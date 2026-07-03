import { Dimension, Measure } from '@embeddable.com/core';
import { Theme } from '../../../../theme/theme.types';
import { PivotTableProps } from '@embeddable.com/remarkable-ui';
import { getThemeFormatter } from '../../../../theme/formatter/formatter.utils';
import { PivotAggregationTypeOptions } from '../../../types/PivotAggregation.type.emb';

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

const measureKeysFor = (
  measures: Measure[],
  field: 'columnAggregation' | 'rowAggregation',
  type: string,
): string[] =>
  measures
    .filter((m) => (m.inputs?.[field] as string[] | undefined)?.includes(type))
    .map((m) => m.name);

export const getPivotColumnAggregationsFor = (
  measures: Measure[],
): Pick<
  PivotTableProps<any>,
  'columnSumFor' | 'columnMinFor' | 'columnMaxFor' | 'columnAverageFor'
> => ({
  columnSumFor: measureKeysFor(measures, 'columnAggregation', PivotAggregationTypeOptions.sum),
  columnMinFor: measureKeysFor(measures, 'columnAggregation', PivotAggregationTypeOptions.min),
  columnMaxFor: measureKeysFor(measures, 'columnAggregation', PivotAggregationTypeOptions.max),
  columnAverageFor: measureKeysFor(
    measures,
    'columnAggregation',
    PivotAggregationTypeOptions.average,
  ),
});

export const getPivotRowAggregationsFor = (
  measures: Measure[],
): Pick<PivotTableProps<any>, 'rowSumFor' | 'rowMinFor' | 'rowMaxFor' | 'rowAverageFor'> => ({
  rowSumFor: measureKeysFor(measures, 'rowAggregation', PivotAggregationTypeOptions.sum),
  rowMinFor: measureKeysFor(measures, 'rowAggregation', PivotAggregationTypeOptions.min),
  rowMaxFor: measureKeysFor(measures, 'rowAggregation', PivotAggregationTypeOptions.max),
  rowAverageFor: measureKeysFor(measures, 'rowAggregation', PivotAggregationTypeOptions.average),
});
