import { Value } from '@embeddable.com/core';
import { EmbeddedComponentMeta, Inputs, definePreview } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../component.inputs.constants';
import { previewData } from '../../preview.data.constants';

const meta = {
  name: 'MeasureSingleSelectFieldPro',
  label: 'Measure Single Select Field',
  category: 'Dropdowns',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.dataset,
    inputs.title,
    inputs.description,
    inputs.tooltip,
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

const preview = definePreview(Component, {
  measureOptions: [previewData.measure, previewData.measureVariant],
  onChange: () => null,
});

const props = (inputs: Inputs<typeof meta>) => {
  return {
    ...inputs,
    measureOptions: inputs.measureOptions ?? [],
  };
};

const events = {
  onChange: (value: unknown) => {
    return {
      value: value ?? Value.noFilter(),
    };
  },
};

export const measureSingleSelectFieldPro = {
  Component,
  meta,
  preview,
  config: {
    props,
    events,
  },
} as const;
