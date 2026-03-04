import { EmbeddedComponentMeta, Inputs, definePreview } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../component.inputs.constants';
import { getStyle } from '@embeddable.com/remarkable-ui';

const meta = {
  name: 'HorizontalDividerPro',
  label: 'Horizontal Divider',
  category: 'Layout',
  defaultWidth: 450,
  defaultHeight: 120,
  inputs: [
    {
      ...inputs.number,
      name: 'thickness',
      label: 'Thickness',
      category: 'Component Settings',
      description: 'Thickness of the divider in pixels',
    },
    { ...inputs.color, defaultValue: getStyle('--em-divider-color', '#e4e4ea') },
  ],
} as const satisfies EmbeddedComponentMeta;

const preview = definePreview(Component, {});

const props = (inputs: Inputs<typeof meta>) => ({
  ...inputs,
  color: inputs.color as string | undefined,
});

export const horizontalDividerPro = {
  Component,
  meta,
  preview,
  config: {
    props,
  },
} as const;
