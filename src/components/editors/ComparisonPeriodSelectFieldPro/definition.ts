import { EmbeddedComponentMeta, Inputs, definePreview } from '@embeddable.com/react';
import { Value } from '@embeddable.com/core';
import Component from './index';
import ComparisonPeriodType from '../../types/ComparisonPeriod.type.emb';
import { inputs } from '../../component.inputs.constants';

const meta = {
  name: 'ComparisonPeriodSelectFieldPro',
  label: 'Comparison Period Select Field',
  category: 'Dropdowns - dates',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.title,
    inputs.description,
    inputs.tooltip,
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
      label: 'Selected comparison period',
      category: 'Pre-configured variables',
    },
  ],
  events: [
    {
      name: 'onChange',
      label: 'Selected comparison-period updated',
      properties: [
        {
          name: 'value',
          label: 'Selected comparison-period',
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

const preview = definePreview(Component, {
  onChange: () => null,
});

const props = (inputs: Inputs<typeof meta>) => inputs;

const events = {
  onChange: (value: unknown) => {
    return {
      value: value || Value.noFilter(),
    };
  },
};

export const comparisonPeriodSelectFieldPro = {
  Component,
  meta,
  preview,
  config: {
    props,
    events,
  },
} as const;
