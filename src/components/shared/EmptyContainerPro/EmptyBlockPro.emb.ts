import { defineComponent, definePreview, EmbeddedComponentMeta } from '@embeddable.com/react';
import EmptyBlockPro from './index';

export const meta = {
  name: 'EmptyBlockPro',
  label: 'Empty Block',
  category: 'Layout',
  defaultWidth: 450,
  defaultHeight: 120,
} as const satisfies EmbeddedComponentMeta;

export const preview = definePreview(EmptyBlockPro, {});

export default defineComponent(EmptyBlockPro, meta, {
  props: () => ({}),
});
