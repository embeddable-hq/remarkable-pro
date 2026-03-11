import { EmbeddedComponentMeta, Inputs, definePreview } from '@embeddable.com/react';
import { Value } from '@embeddable.com/core';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';

const meta = {
  name: 'DateRangeSelectFieldPro',
  label: 'Date-Range Picker - Presets',
  category: 'Dropdowns - dates',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.title,
    inputs.description,
    inputs.tooltip,
    { ...inputs.placeholder, defaultValue: 'Select a date-range' },
    {
      ...inputs.boolean,
      name: 'showCustomRangeOptions',
      label: 'Show custom date-range option',
      defaultValue: true,
      category: 'Component Settings',
    },
    {
      ...inputs.boolean,
      name: 'showTwoMonths',
      label: 'Show two-month view',
      defaultValue: false,
      category: 'Component Settings',
    },
    inputs.clearable,
    {
      ...inputs.timeRange,
      name: 'selectedValue',
      label: 'Selected value',
      category: 'Pre-configured variables',
    },
  ],
  events: [
    {
      name: 'onChange',
      label: 'Selected date-range updated',
      properties: [
        {
          name: 'value',
          label: 'Selected date-range',
          type: 'timeRange',
        },
      ],
    },
  ],
  variables: [
    {
      name: 'date-range value',
      type: 'timeRange',
      defaultValue: Value.noFilter(),
      inputs: ['selectedValue'],
      events: [{ name: 'onChange', property: 'value' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

const preview = definePreview(Component, {
  showCustomRangeOptions: true,
  onChange: () => null,
});

const props = (inputs: Inputs<typeof meta>) => {
  return {
    ...inputs,
  };
};

const events = {
  onChange: (range: unknown) => ({
    value: range ?? Value.noFilter(),
  }),
};

export const dateRangeSelectFieldPro = {
  Component,
  meta,
  preview,
  config: {
    props,
    events,
  },
} as const;
