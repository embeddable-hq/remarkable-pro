import { defineComponent } from '@embeddable.com/react';
import { emptyBlockPro } from './definition';

export const preview = emptyBlockPro.preview;

export const meta = emptyBlockPro.meta;

export default defineComponent(emptyBlockPro.Component, meta, emptyBlockPro.config);
