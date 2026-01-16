import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import { Value } from '@embeddable.com/core';
import DateRangeSelectFieldPro from './index';
import { inputs } from '../../../component.inputs.constants';

export const meta = {
  name: 'DateRangeSelectFieldPro',
  label: 'Date-Range Picker - Presets',
  category: 'Dropdowns',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    { ...inputs.title },
    { ...inputs.description },
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

export const preview = definePreview(DateRangeSelectFieldPro, {
  showCustomRangeOptions: true,
  onChange: () => null,
});

export default defineComponent(DateRangeSelectFieldPro, meta, {
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
