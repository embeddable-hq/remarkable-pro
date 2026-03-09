import { Value } from '@embeddable.com/core';
import { EmbeddedComponentMeta, Inputs, definePreview } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../component.inputs.constants';
import { previewData } from '../../preview.data.constants';

const meta = {
  name: 'DimensionSingleSelectFieldPro',
  label: 'Dimension Single Select Field',
  category: 'Dropdowns - dimensions and measures',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.dataset,
    inputs.title,
    inputs.description,
    inputs.tooltip,
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

const preview = definePreview(Component, {
  dimensionOptions: [previewData.dimension, previewData.dimensionGroup],
  onChange: () => null,
});

const props = (inputs: Inputs<typeof meta>) => {
  return {
    ...inputs,
    dimensionOptions: inputs.dimensionOptions ?? [],
  };
};

const events = {
  onChange: (value: unknown) => {
    return {
      value: value ?? Value.noFilter(),
    };
  },
};

export const dimensionSingleSelectFieldPro = {
  Component,
  meta,
  preview,
  config: {
    props,
    events,
  },
} as const;
