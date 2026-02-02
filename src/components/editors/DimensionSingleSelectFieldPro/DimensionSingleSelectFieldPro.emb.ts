import { Value } from '@embeddable.com/core';
import {
  EmbeddedComponentMeta,
  Inputs,
  defineComponent,
  definePreview,
} from '@embeddable.com/react';
import DimensionSingleSelectFieldPro from './index';
import { inputs } from '../../component.inputs.constants';
import { previewData } from '../../preview.data.constants';

export const meta = {
  name: 'DimensionSingleSelectFieldPro',
  label: 'Dimension Single Select Field',
  category: 'Dropdowns',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.dataset,
    inputs.title,
    inputs.description,
    { ...inputs.placeholder, defaultValue: 'Select value...' },
    inputs.dimensionOptions,
    {
      ...inputs.dimension,
      name: 'selectedDimension',
      label: 'Selected dimension',
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
      label: 'Selected dimension updated',
      properties: [
        {
          name: 'value',
          label: 'Selected dimension',
          type: 'dimension',
        },
      ],
    },
  ],
  variables: [
    {
      name: 'dimension single-select value',
      type: 'dimension',
      defaultValue: Value.noFilter(),
      inputs: ['selectedDimension'],
      events: [{ name: 'onChange', property: 'value' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export const preview = definePreview(DimensionSingleSelectFieldPro, {
  dimensionOptions: [previewData.dimension, previewData.dimensionGroup],
  onChange: () => null,
});

export default defineComponent(DimensionSingleSelectFieldPro, meta, {
  props: (inputs: Inputs<typeof meta>) => {
    if (!inputs.dataset)
      return {
        ...inputs,
        dimensionOptions: [],
      };

    return {
      ...inputs,
      dimensionOptions: inputs.dimensionOptions ?? [],
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
