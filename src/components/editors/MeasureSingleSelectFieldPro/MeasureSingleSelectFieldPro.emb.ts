import { Value } from '@embeddable.com/core';
import {
  EmbeddedComponentMeta,
  Inputs,
  defineComponent,
  definePreview,
} from '@embeddable.com/react';
import MeasureSingleSelectFieldPro from './index';
import { inputs } from '../../component.inputs.constants';
import { previewData } from '../../preview.data.constants';

export const meta = {
  name: 'MeasureSingleSelectFieldPro',
  label: 'Measure Single Select Field',
  category: 'Dropdowns',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.dataset,
    inputs.title,
    inputs.description,
    { ...inputs.placeholder, defaultValue: 'Select value...' },
    inputs.measureOptions,
    {
      ...inputs.measure,
      name: 'selectedMeasure',
      label: 'Selected measure',
      category: 'Pre-configured variables',
      required: false,
      config: {
        dataset: 'dataset',
      },
    },
    { ...inputs.clearable, defaultValue: false },
  ],
  events: [
    {
      name: 'onChange',
      label: 'Selected measure updated',
      properties: [
        {
          name: 'value',
          label: 'Selected measure',
          type: 'measure',
        },
      ],
    },
  ],
  variables: [
    {
      name: 'measure single-select value',
      type: 'measure',
      defaultValue: Value.noFilter(),
      inputs: ['selectedMeasure'],
      events: [{ name: 'onChange', property: 'value' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export const preview = definePreview(MeasureSingleSelectFieldPro, {
  measureOptions: [previewData.measure, previewData.measureVariant],
  onChange: () => null,
});

export default defineComponent(MeasureSingleSelectFieldPro, meta, {
  props: (inputs: Inputs<typeof meta>) => {
    return {
      ...inputs,
      measureOptions: inputs.measureOptions ?? [],
    };
  },
  events: {
    onChange: (value) => {
      return {
        value: value ?? Value.noFilter(),
      };
    },
  },
});
