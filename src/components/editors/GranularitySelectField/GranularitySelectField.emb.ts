import { defineComponent, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import { Value } from '@embeddable.com/core';
import DateTimeSelectFieldPro from './index';
import { inputs } from '../../component.inputs.constants';

export const meta = {
  name: 'GranularitySelectField',
  label: 'Granularity Select Field',
  category: 'Dropdowns',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.title,
    inputs.description,
    { ...inputs.placeholder, defaultValue: 'Select a granularity' },
    {
      ...inputs.granularities,
      label: 'Available granularities',
      category: 'Pre-configured variables',
      // Ignore seconds and minutes
      defaultValue: ['hour', 'day', 'week', 'month', 'quarter', 'year'],
    },
    {
      ...inputs.granularity,
      label: 'Selected granularity',
      category: 'Pre-configured variables',
    },
    {
      ...inputs.timeRange,
      name: 'primaryTimeRange',
      label: 'Primary time range',
      category: 'Pre-configured variables',
    },
  ],
  events: [
    {
      name: 'onChange',
      label: 'selected granularity updated',
      properties: [
        {
          name: 'value',
          label: 'selected granularity',
          type: 'granularity',
        },
      ],
    },
  ],
  variables: [
    {
      name: 'granularity value',
      type: 'granularity',
      defaultValue: 'day',
      inputs: ['granularity'],
      events: [{ name: 'onChange', property: 'value' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export default defineComponent(DateTimeSelectFieldPro, meta, {
  props: (inputs: Inputs<typeof meta>) => {
    return {
      ...inputs,
    };
  },
  events: {
    onChange: (granularity) => ({
      value: granularity ?? Value.noFilter(),
    }),
  },
});
