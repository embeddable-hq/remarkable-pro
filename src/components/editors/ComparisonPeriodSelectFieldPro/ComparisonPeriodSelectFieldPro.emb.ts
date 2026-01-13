import { defineComponent, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import { Value } from '@embeddable.com/core';
import ComparisonPeriodSelectFieldPro from './index';
import ComparisonPeriodType from '../../types/ComparisonPeriod.type.emb';
import { inputs } from '../../component.inputs.constants';

export const meta = {
  name: 'ComparisonPeriodSelectFieldPro',
  label: 'Comparison Period Select Field',
  category: 'Dropdowns',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    { ...inputs.title },
    { ...inputs.description },
    { ...inputs.placeholder, defaultValue: 'Select a date-comparison' },
    {
      ...inputs.timeRange,
      name: 'primaryDateRange',
      label: 'Primary date-range',
      category: 'Pre-configured variables',
      description: 'Pick the main time period. The comparison range is based on this selection.',
    },
    {
      ...inputs.comparisonPeriod,
      label: 'Selected Comparison Period',
      category: 'Pre-configured variables',
    },
  ],
  events: [
    {
      name: 'onChange',
      label: 'selected comparison-period updated',
      properties: [
        {
          name: 'value',
          label: 'selected comparison-period',
          type: ComparisonPeriodType,
        },
      ],
    },
  ],
  variables: [
    {
      name: 'comparison-period value',
      type: ComparisonPeriodType,
      defaultValue: Value.noFilter(),
      inputs: ['comparisonPeriod'],
      events: [{ name: 'onChange', property: 'value' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export default defineComponent(ComparisonPeriodSelectFieldPro, meta, {
  props: (inputs: Inputs<typeof meta>) => inputs,
  events: {
    onChange: (value) => {
      return {
        value: value || Value.noFilter(),
      };
    },
  },
});
