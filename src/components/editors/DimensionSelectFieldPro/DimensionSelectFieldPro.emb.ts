import {
  defineComponent,
  definePreview,
  EmbeddedComponentMeta,
  Inputs,
} from '@embeddable.com/react';
import { Value } from '@embeddable.com/core';
import { inputs } from '../../component.inputs.constants';
import { subInputs } from '../../component.subinputs.constants';
import DimensionSelectFieldPro from '.';

// Sub-inputs for dimensions: displayName for i18n, granularity for time dimensions
const dimensionSubInputs = [
  subInputs.displayName,
  {
    ...subInputs.granularity,
    supportedTypes: ['time'] as ('time' | 'string' | 'number' | 'boolean' | 'geo')[],
    defaultValue: 'day',
  },
];

export const meta = {
  name: 'DimensionSelectFieldPro',
  label: 'Dimension Select Field',
  category: 'Dropdowns',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.dataset,
    inputs.title,
    inputs.description,
    { ...inputs.placeholder, defaultValue: 'Select a dimension' },
    {
      ...inputs.dimension,
      name: 'dimensions',
      label: 'Available dimensions',
      array: true,
      category: 'Component Data',
      inputs: dimensionSubInputs,
    },
    {
      ...inputs.dimensionSimple,
      name: 'dimension',
      label: 'Selected dimension',
      category: 'Pre-configured variables',
      required: false,
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
      name: 'dimension value',
      type: 'dimension',
      defaultValue: Value.noFilter(),
      inputs: ['dimension'],
      events: [{ name: 'onChange', property: 'value' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

export const preview = definePreview(DimensionSelectFieldPro, {
  dimensions: [],
  onChange: () => null,
});

export default defineComponent(DimensionSelectFieldPro, meta, {
  props: (inputs: Inputs<typeof meta>) => {
    return {
      ...inputs,
    };
  },
  events: {
    onChange: (dimension) => ({
      value: dimension ?? Value.noFilter(),
    }),
  },
});
