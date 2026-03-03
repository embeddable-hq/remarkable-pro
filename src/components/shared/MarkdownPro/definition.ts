// NOSONAR

import { EmbeddedComponentMeta, Inputs, definePreview } from '@embeddable.com/react';
import Component from './index';
import { inputs } from '../../component.inputs.constants';

const meta = {
  name: 'MarkdownPro',
  label: 'Markdown',
  category: 'Layout',
  defaultWidth: 600,
  defaultHeight: 300,
  inputs: [inputs.markdown],
} as const satisfies EmbeddedComponentMeta;

const preview = definePreview(Component, {
  markdown:
    '# Markdown editor\n\nWrite **bold**, *italic*, and `inline code`.\n\n- Bullet lists\n- [Links](https://example.com)',
});

const props = (inputs: Inputs<typeof meta>) => ({ ...inputs });

export const markdownPro = {
  Component,
  meta,
  preview,
  config: {
    props,
  },
} as const;
