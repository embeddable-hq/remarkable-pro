import { EmbeddedComponentMeta, Inputs, definePreview } from '@embeddable.com/react';
import { Value } from '@embeddable.com/core';
import { inputs } from '../../component.inputs.constants';
import { Granularity } from '../../../theme/defaults/defaults.GranularityOptions.constants';
import Component from './index';

const meta = {
  name: 'GranularitySelectFieldPro',
  label: 'Granularity Select Field',
  category: 'Dropdowns - dates',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.title,
    inputs.description,
    inputs.tooltip,
    { ...inputs.placeholder, defaultValue: 'Select a granularity' },
    {
      ...inputs.granularities,
      label: 'Available granularities',
      category: 'Pre-configured variables',
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

const preview = definePreview(Component, {
  granularities: [
    Granularity.second,
    Granularity.minute,
    Granularity.hour,
    Granularity.day,
    Granularity.week,
    Granularity.month,
    Granularity.quarter,
    Granularity.year,
  ],
  onChange: () => null,
});

const props = (inputs: Inputs<typeof meta>) => {
  return {
    ...inputs,
  };
};

const events = {
  onChange: (granularity: unknown) => ({
    value: granularity ?? Value.noFilter(),
  }),
};

export const granularitySelectFieldPro = {
  Component,
  meta,
  preview,
  config: {
    props,
    events,
  },
} as const;
