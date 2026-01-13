import { defineComponent, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import { Value } from '@embeddable.com/core';
import DateTimeSelectFieldPro from './index';
import { inputs } from '../../../component.inputs.constants';

export const meta = {
  name: 'DateRangePickerCustomPro',
  label: 'Date-Range Picker - Custom',
  category: 'Dropdowns',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.title,
    inputs.description,
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
      label: 'selected date-range updated',
      properties: [
        {
          name: 'value',
          label: 'selected date-range',
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

export default defineComponent(DateTimeSelectFieldPro, meta, {
  props: (inputs: Inputs<typeof meta>) => {
    return {
      ...inputs,
    };
  },
  events: {
    onChange: (range) => ({
      value: range ?? Value.noFilter(),
    }),
  },
});
