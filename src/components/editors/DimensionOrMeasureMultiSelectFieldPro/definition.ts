import { Value } from '@embeddable.com/core';
import { EmbeddedComponentMeta, Inputs, definePreview } from '@embeddable.com/react';
import Component from './DimensionOrMeasureMultiSelectFieldPro';
import { inputs } from '../../component.inputs.constants';
import { previewData } from '../../preview.data.constants';

const meta = {
  name: 'DimensionOrMeasureMultiSelectFieldPro',
  label: 'Dimension and Measure Multi Select Field',
  category: 'Dropdowns',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.dataset,
    {
      ...inputs.dimensionsAndMeasures,
      label: 'Dimensions and measures (to show in dropdown)',
      required: false,
    },
    inputs.title,
    inputs.description,
    inputs.tooltip,
    { ...inputs.placeholder, defaultValue: 'Select values...' },
    {
      ...inputs.dimensionsAndMeasures,
      name: 'selectedDimensionsAndMeasures',
      label: 'Selected values',
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
      label: 'Selected values updated',
      properties: [
        {
          name: 'value',
          label: 'Selected values',
          type: 'dimensionOrMeasure',
          array: true,
        },
      ],
    },
  ],
  variables: [
    {
      name: 'dimension-or-measure multi-select values',
      type: 'dimensionOrMeasure',
      array: true,
      defaultValue: Value.noFilter(),
      inputs: ['selectedDimensionsAndMeasures'],
      events: [{ name: 'onChange', property: 'value' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

const preview = definePreview(Component, {
  dimensionsAndMeasures: [previewData.dimension, previewData.measure],
  onChange: () => null,
});

const props = (inputs: Inputs<typeof meta>) => {
  return {
    ...inputs,
    dimensionsAndMeasures: inputs.dimensionsAndMeasures ?? [],
  };
};

const events = {
  onChange: (value: unknown) => {
    return {
      value: Array.isArray(value) && value.length ? value : Value.noFilter(),
    };
  },
};

export const dimensionOrMeasureMultiSelectFieldPro = {
  Component,
  meta,
  preview,
  config: {
    props,
    events,
  },
} as const;
