import { Value } from '@embeddable.com/core';
import { EmbeddedComponentMeta, Inputs, definePreview } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../component.inputs.constants';
import { previewData } from '../../preview.data.constants';

const meta = {
  name: 'MeasureMultiSelectFieldPro',
  label: 'Measure Multi Select Field',
  category: 'Dropdowns - dimensions and measures',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.dataset,
    inputs.measureOptions,
    inputs.title,
    inputs.description,
    inputs.tooltip,
    { ...inputs.placeholder, defaultValue: 'Select values...' },
    {
      ...inputs.measure,
      array: true,
      name: 'selectedMeasures',
      label: 'Selected measures',
      category: 'Pre-configured Variables',
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
      label: 'Selected measures updated',
      properties: [
        {
          name: 'value',
          label: 'Selected values',
          type: 'measure',
          array: true,
        },
      ],
    },
  ],
  variables: [
    {
      name: 'measure multi-select values',
      type: 'measure',
      array: true,
      defaultValue: Value.noFilter(),
      inputs: ['selectedMeasures'],
      events: [{ name: 'onChange', property: 'value' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

const preview = definePreview(Component, {
  measureOptions: [previewData.measure, previewData.measureVariant],
  onChange: () => null,
});

const props = (inputs: Inputs<typeof meta>) => {
  return {
    ...inputs,
    measureOptions: inputs.measureOptions ?? [],
    selectedMeasures: inputs.selectedMeasures ?? [],
  };
};

const events = {
  onChange: (value: unknown) => {
    return {
      value: Array.isArray(value) && value.length ? value : Value.noFilter(),
    };
  },
};

export const measureMultiSelectFieldPro = {
  Component,
  meta,
  preview,
  config: {
    props,
    events,
  },
} as const;
