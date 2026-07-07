import { defineOption, defineType } from '@embeddable.com/core';

export const PivotAggregationTypeOptions = {
  sum: 'sum',
  min: 'min',
  max: 'max',
  average: 'average',
} as const;

const PivotAggregationType = defineType('pivotAggregation', {
  label: 'Pivot aggregation',
  optionLabel: (value: string) => value,
});

defineOption(PivotAggregationType, PivotAggregationTypeOptions.sum);
defineOption(PivotAggregationType, PivotAggregationTypeOptions.min);
defineOption(PivotAggregationType, PivotAggregationTypeOptions.max);
defineOption(PivotAggregationType, PivotAggregationTypeOptions.average);

export default PivotAggregationType;
