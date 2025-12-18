import { defineComponent, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import { Value } from '@embeddable.com/core';
import DateTimeSelectFieldPro from './index';
import { description, genericBoolean, placeholder, title } from '../../component.constants';

export const meta = {
  name: 'DateRangeSelectFieldPro',
  label: 'Date-Range Picker - Presets',
  category: 'Dropdowns',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    { ...title },
    { ...description },
    { ...placeholder, defaultValue: 'Select a date-range' },
    {
      ...genericBoolean,
      name: 'showCustomRangeOptions',
      label: 'Show custom range options',
      defaultValue: true,
    },
    { ...genericBoolean, name: 'clearable', label: 'Can be cleared', defaultValue: true },
    {
      name: 'selectedValue',
      type: 'timeRange',
      label: 'Selected Value',
      category: 'Pre-configured variables',
    },
    {
      ...genericBoolean,
      name: 'showTwoMonths',
      label: 'Show two months',
      defaultValue: false,
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
