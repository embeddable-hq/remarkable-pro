import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import { Value } from '@embeddable.com/core';
import { inputs } from '../../component.inputs.constants';
import { subInputs } from '../../component.subinputs.constants';
import MeasureSelectFieldPro from '.';

// Sub-inputs for measures: displayName for i18n
const measureSubInputs = [subInputs.displayName];

export const meta = {
  name: 'MeasureSelectFieldPro',
  label: 'Measure Select Field',
  category: 'Dropdowns',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.dataset,
    inputs.title,
    inputs.description,
    { ...inputs.placeholder, defaultValue: 'Select a measure' },
    {
      ...inputs.measure,
      name: 'measures',
      label: 'Available measures',
      array: true,
      category: 'Component Data',
      inputs: measureSubInputs,
    },
    {
      ...inputs.measure,
      name: 'measure',
      label: 'Selected measure',
      category: 'Pre-configured variables',
      required: false,
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
      name: 'measure value',
      type: 'measure',
      defaultValue: Value.noFilter(),
      inputs: ['measure'],
      events: [{ name: 'onChange', property: 'value' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export const preview = definePreview(MeasureSelectFieldPro, {
  measures: [],
  onChange: () => null,
});

export default defineComponent(MeasureSelectFieldPro, meta, {
  props: (inputs: Inputs<typeof meta>) => {
    return {
      ...inputs,
    };
  },
  events: {
    onChange: (measure) => ({
      value: measure ?? Value.noFilter(),
    }),
  },
});
