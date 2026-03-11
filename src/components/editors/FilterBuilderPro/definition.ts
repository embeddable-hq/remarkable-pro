import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import { Value } from '@embeddable.com/core';
import Component from '.';
import { inputs } from '../../component.inputs.constants';

const meta = {
  name: 'FilterBuilderPro',
  label: 'Filter Builder',
  category: 'Filters',
  defaultWidth: 300,
  defaultHeight: 80,
  inputs: [inputs.dataset, inputs.dimensionAndMeasureOptions],
  events: [
    {
      name: 'onApply',
      label: 'Apply',
      properties: [
        {
          name: 'value',
          type: 'filters',
        },
      ],
    },
  ],
  variables: [
    {
      name: 'filter builder filters',
      type: 'filters',
      defaultValue: Value.noFilter(),
      inputs: [],
      events: [{ name: 'onApply', property: 'value' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

const preview = definePreview(Component, {
  onApply: () => null,
});

const props = (inputs: Inputs<typeof meta>) => ({
  ...inputs,
  dimensionsAndMeasures: inputs.dimensionsAndMeasures ?? [],
});

const events = {
  onApply: (value: unknown) => ({
    value,
  }),
};

export const filterBuilderPro = {
  Component,
  meta,
  preview,
  config: {
    props,
    events,
  },
} as const;
