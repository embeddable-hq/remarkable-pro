import { EmbeddedComponentMeta, Inputs, definePreview } from '@embeddable.com/react';
import { TimeRange, Value } from '@embeddable.com/core';
import Component from './index';
import { inputs } from '../../../component.inputs.constants';

const meta = {
  name: 'DateRangePickerCustomPro',
  label: 'Date-Range Picker - Custom',
  category: 'Dropdowns',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.title,
    inputs.description,
    inputs.tooltip,
    { ...inputs.placeholder, defaultValue: 'Select a date-range' },
    inputs.clearable,
    {
      ...inputs.timeRange,
      name: 'selectedValue',
      label: 'Selected value',
      category: 'Pre-configured variables',
    },
    {
      ...inputs.boolean,
      name: 'showTwoMonths',
      label: 'Show two months',
      defaultValue: false,
      category: 'Component Settings',
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
        {
          name: 'fromDate',
          label: 'Start date of selected range',
          type: 'time',
        },
        {
          name: 'toDate',
          label: 'To date of selected range',
          type: 'time',
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
  onChange: () => null,
});

const props = (inputs: Inputs<typeof meta>) => {
  return {
    ...inputs,
  };
};

const events = {
  onChange: (timeRange: TimeRange) => {
    return {
      value: timeRange ?? Value.noFilter(),
      fromDate: timeRange?.from ? { date: timeRange?.from } : Value.noFilter(),
      toDate: timeRange?.to ? { date: timeRange?.to } : Value.noFilter(),
    };
  },
};

export const dateRangePickerCustomPro = {
  Component,
  meta,
  preview,
  config: {
    props,
    events,
  },
} as const;
