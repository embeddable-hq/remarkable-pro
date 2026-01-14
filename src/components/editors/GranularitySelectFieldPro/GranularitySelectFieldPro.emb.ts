import { defineComponent, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import { Value } from '@embeddable.com/core';
import DateTimeSelectFieldPro from './index';
import { inputs } from '../../component.inputs.constants';
import { Granularity } from '../../../theme/defaults/defaults.GranularityOptions.constants';

export const meta = {
  name: 'GranularitySelectFieldPro',
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
      defaultValue: [
        Granularity.hour,
        Granularity.day,
        Granularity.week,
        Granularity.month,
        Granularity.quarter,
        Granularity.year,
      ],
    },
    {
      ...inputs.granularity,
      label: 'Selected granularity',
      category: 'Pre-configured variables',
    },
    {
      ...inputs.timeRange,
      name: 'primaryTimeRange',
      label: 'Primary date-range',
      description:
        'Connect your primary date-range variable to enable automatic selection of the most appropriate granularity',
      category: 'Pre-configured variables',
    },
    { ...inputs.clearable, defaultValue: false },
  ],
  events: [
    {
      name: 'onChange',
      label: 'Selected granularity updated',
      properties: [
        {
          name: 'value',
          label: 'Selected granularity',
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
