import { EmbeddedComponentMeta, definePreview } from '@embeddable.com/react';
import Component from './index';

const meta = {
  name: 'EmptyBlockPro',
  label: 'Empty Block',
  category: 'Layout',
  defaultWidth: 450,
  defaultHeight: 120,
} as const satisfies EmbeddedComponentMeta;

const preview = definePreview(Component, {});

const props = () => ({});

export const emptyBlockPro = {
  Component,
  meta,
  preview,
  config: {
    props,
  },
} as const;
