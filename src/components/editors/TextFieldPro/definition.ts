import { definePreview, EmbeddedComponentMeta, Inputs } from '@embeddable.com/react';
import { Value } from '@embeddable.com/core';
import Component from '.';
import { inputs } from '../../component.inputs.constants';

const meta = {
  name: 'TextFieldPro',
  label: 'Text Field',
  category: 'Inputs',
  defaultWidth: 300,
  defaultHeight: 120,
  inputs: [
    inputs.title,
    inputs.description,
    inputs.tooltip,
    inputs.placeholder,
    {
      ...inputs.string,
      name: 'value',
      label: 'Value',
      category: 'Pre-configured Variables',
    },
  ],
  events: [
    {
      name: 'onChange',
      label: 'Entered value updated',
      properties: [
        {
          name: 'value',
          label: 'Entered value',
          type: 'string',
        },
      ],
    },
  ],
  variables: [
    {
      name: 'text value',
      type: 'string',
      defaultValue: Value.noFilter(),
      inputs: ['value'],
      events: [{ name: 'onChange', property: 'value' }],
    },
  ],
} as const satisfies EmbeddedComponentMeta;

const preview = definePreview(Component, {
  placeholder: 'Enter text...',
  onChange: () => null,
});

const props = (inputs: Inputs<typeof meta>) => ({
  ...inputs,
  placeholder: inputs.placeholder ?? '',
});

const events = {
  onChange: (value: string) => ({
    value: value === '' || value == null ? Value.noFilter() : value,
  }),
};

export const textFieldPro = {
  Component,
  meta,
  preview,
  config: {
    props,
    events,
  },
} as const;
